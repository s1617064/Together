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

  function isOfflineError(error) {
    const code = String(error?.code || "").toLowerCase();
    const message = String(error?.message || "").toLowerCase();

    return (
      code.includes("unavailable") ||
      code.includes("offline") ||
      message.includes("client is offline") ||
      message.includes("offline") ||
      message.includes("network")
    );
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
      return authModule.onAuthStateChanged(auth, async (user) => {
        if (!user) {
          callback({ user: null, member: null, error: "" });
          return;
        }

        try {
          const { member, needsMembershipSync } = await getMemberForUser(user);
          if (!member) {
            await authModule.signOut(auth);
            callback({
              user: null,
              member: null,
              error: "这个账号还没有加入共享账本，请先用已加入的设备完成成员绑定。",
            });
            return;
          }

          callback({ user, member, error: "" });

          if (needsMembershipSync) {
            await ensureBookMembership(user, member);
          }
        } catch (error) {
          if (isOfflineError(error)) {
            callback({
              user,
              member: null,
              error: "网络有点慢，先为你打开上次内容，连上后会自动更新。",
              offline: true,
            });
            return;
          }

          await authModule.signOut(auth).catch(() => {});
          callback({
            user: null,
            member: null,
            error: "暂时没连上共享账本，请稍后再试。",
          });
        }
      });
    },
    watchExpenses(callback) {
      const expensesRef = firestoreModule.collection(
        db,
        "books",
        bookId,
        "expenses"
      );
      const expensesQuery = firestoreModule.query(
        expensesRef,
        firestoreModule.orderBy("spentAt", "desc")
      );

      return firestoreModule.onSnapshot(expensesQuery, (snapshot) => {
        callback(snapshot.docs.map(normalizeExpense));
      });
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
