import { firebaseRuntimeConfig } from "./firebase-config.js";

const FIREBASE_VERSION = "12.15.0";

let firebaseContextPromise = null;

export function isFirebaseConfigured() {
  return getFirebaseConfigStatus().ready;
}

export function getConfiguredMembers() {
  return firebaseRuntimeConfig.members;
}

export function getFirebaseConfigStatus() {
  const project = firebaseRuntimeConfig.project;
  const requiredFields = [
    "apiKey",
    "authDomain",
    "projectId",
    "appId",
  ];

  const missingProjectFields = requiredFields.filter(
    (field) => !String(project[field] || "").trim()
  );

  const enabled = Boolean(firebaseRuntimeConfig.enabled);
  const ready =
    enabled &&
    missingProjectFields.length === 0 &&
    String(firebaseRuntimeConfig.sharedBookId || "").trim().length > 0;

  return {
    enabled,
    ready,
    missingProjectFields,
    membersMissingEmails: [],
  };
}

export async function getFirebaseService() {
  if (!isFirebaseConfigured()) {
    return null;
  }

  if (!firebaseContextPromise) {
    firebaseContextPromise = createFirebaseContext();
  }

  return firebaseContextPromise;
}

async function createFirebaseContext() {
  const [{ initializeApp }, authModule, firestoreModule] = await Promise.all([
    import(
      `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-app.js`
    ),
    import(
      `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-auth.js`
    ),
    import(
      `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/firebase-firestore.js`
    ),
  ]);

  const app = initializeApp(firebaseRuntimeConfig.project);
  const auth = authModule.getAuth(app);
  const db = firestoreModule.getFirestore(app);
  const bookId = firebaseRuntimeConfig.sharedBookId;
  const memberTemplates = firebaseRuntimeConfig.members;
  const expensesRef = firestoreModule.collection(db, "books", bookId, "expenses");
  const expensesQuery = firestoreModule.query(
    expensesRef,
    firestoreModule.orderBy("spentAt", "desc")
  );

  function getMemberForEmail(email) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    return (
      memberTemplates.find(
        (member) =>
          String(member.email || "").trim().toLowerCase() === normalizedEmail
      ) ?? null
    );
  }

  function getMemberTemplateByKey(key) {
    return memberTemplates.find((member) => member.key === key) ?? null;
  }

  function normalizeMemberRecord(data) {
    const key = String(data.memberKey || "");
    const template = getMemberTemplateByKey(key);
    return {
      key: key || template?.key || "",
      name: String(data.displayName || template?.name || "成员"),
      accentClass: String(data.accentClass || template?.accentClass || ""),
    };
  }

  async function getMemberForUser(user) {
    const memberRef = firestoreModule.doc(
      db,
      "books",
      bookId,
      "members",
      user.uid
    );
    const memberSnapshot = await firestoreModule.getDoc(memberRef);

    if (memberSnapshot.exists()) {
      return {
        member: normalizeMemberRecord(memberSnapshot.data()),
        needsMembershipSync: false,
      };
    }

    // Legacy fallback: support older setups that still used email-based matching,
    // then immediately write the resolved membership into Firestore.
    return {
      member: getMemberForEmail(user.email),
      needsMembershipSync: true,
    };
  }

  async function ensureBookMembership(user, member) {
    const memberRef = firestoreModule.doc(
      db,
      "books",
      bookId,
      "members",
      user.uid
    );
    const bookRef = firestoreModule.doc(db, "books", bookId);

    // Write membership first so a second user can become a member before
    // touching the shared book document, which may otherwise fail rules checks.
    await firestoreModule.setDoc(
      memberRef,
      {
        uid: user.uid,
        email: user.email,
        memberKey: member.key,
        displayName: member.name,
        accentClass: member.accentClass,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    await firestoreModule.setDoc(
      bookRef,
      {
        name: "Together 账本",
        currency: "CNY",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  function normalizeExpense(snapshotDoc) {
    const data = snapshotDoc.data();
    return {
      id: snapshotDoc.id,
      amount: Number(data.amount || 0),
      category: String(data.category || ""),
      note: String(data.note || ""),
      spentAt: String(data.spentAt || new Date().toISOString()),
      ownerUid: String(data.ownerUid || ""),
      recordedByMemberKey: String(data.recordedByMemberKey || ""),
      recordedByName: String(data.recordedByName || ""),
      recordedByAccentClass: String(data.recordedByAccentClass || ""),
      createdAt: String(data.createdAt || new Date().toISOString()),
      updatedAt: String(data.updatedAt || new Date().toISOString()),
    };
  }

  function getReadableFirestoreError(error) {
    const code = String(error?.code || "");
    const messages = {
      "permission-denied":
        "当前账号还没有访问这本账本的权限，请检查 Firestore 规则和成员绑定。",
      unavailable: "当前网络不可用，请稍后再试。",
      unauthenticated: "登录状态已失效，请重新登录。",
      "failed-precondition": "Firestore 还没有准备好，请检查数据库配置。",
    };

    return messages[code] || error?.message || "请检查 Firestore 规则。";
  }

  return {
    auth,
    async signIn(email, password) {
      return authModule.signInWithEmailAndPassword(auth, email, password);
    },
    async signUp(email, password) {
      return authModule.createUserWithEmailAndPassword(auth, email, password);
    },
    async signOut() {
      return authModule.signOut(auth);
    },
    watchAuth(callback) {
      let authEventId = 0;

      return authModule.onAuthStateChanged(auth, async (user) => {
        const eventId = ++authEventId;
        const isStale = () => eventId !== authEventId;

        if (!user) {
          callback({ status: "signed-out", user: null, member: null, error: "" });
          return;
        }

        callback({
          status: "resolving-member",
          user,
          member: null,
          error: "",
        });

        try {
          const { member, needsMembershipSync } = await getMemberForUser(user);
          if (isStale()) return;

          if (!member) {
            await authModule.signOut(auth);
            if (isStale()) return;
            callback({
              status: "error",
              user: null,
              member: null,
              error: "这个账号还没有加入共享账本，请先用已加入的设备完成成员绑定。",
            });
            return;
          }

          if (needsMembershipSync) {
            callback({
              status: "syncing-member",
              user,
              member,
              error: "",
            });
            await ensureBookMembership(user, member);
            if (isStale()) return;
          }

          callback({ status: "ready", user, member, error: "" });
        } catch (error) {
          await authModule.signOut(auth).catch(() => {});
          if (isStale()) return;
          callback({
            status: "error",
            user: null,
            member: null,
            error: `同步账本失败：${getReadableFirestoreError(error)}`,
          });
        }
      });
    },
    watchExpenses(callback, onError) {
      return firestoreModule.onSnapshot(
        expensesQuery,
        (snapshot) => {
          callback(snapshot.docs.map(normalizeExpense));
        },
        (error) => {
          onError?.(new Error(getReadableFirestoreError(error)));
        }
      );
    },
    async refreshExpenses() {
      try {
        const snapshot = await firestoreModule.getDocsFromServer(expensesQuery);
        return snapshot.docs.map(normalizeExpense);
      } catch (error) {
        throw new Error(getReadableFirestoreError(error));
      }
    },
    async saveExpense(expense, user, member) {
      const docRef = expense.id
        ? firestoreModule.doc(db, "books", bookId, "expenses", expense.id)
        : firestoreModule.doc(
            firestoreModule.collection(db, "books", bookId, "expenses")
          );

      const payload = {
        amount: Number(expense.amount),
        category: String(expense.category),
        note: String(expense.note || ""),
        spentAt: String(expense.spentAt),
        ownerUid: user.uid,
        recordedByMemberKey: member.key,
        recordedByName: member.name,
        recordedByAccentClass: member.accentClass,
        createdAt: expense.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await firestoreModule.setDoc(docRef, payload, { merge: true });
      return docRef.id;
    },
    async deleteExpense(expenseId) {
      const docRef = firestoreModule.doc(db, "books", bookId, "expenses", expenseId);
      await firestoreModule.deleteDoc(docRef);
    },
  };
}
