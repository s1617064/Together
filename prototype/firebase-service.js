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

  const membersMissingEmails = firebaseRuntimeConfig.members
    .filter((member) => !String(member.email || "").trim())
    .map((member) => member.name);

  const enabled = Boolean(firebaseRuntimeConfig.enabled);
  const ready =
    enabled &&
    missingProjectFields.length === 0 &&
    membersMissingEmails.length === 0;

  return {
    enabled,
    ready,
    missingProjectFields,
    membersMissingEmails,
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

  function getMemberForEmail(email) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    return (
      firebaseRuntimeConfig.members.find(
        (member) => member.email.trim().toLowerCase() === normalizedEmail
      ) ?? null
    );
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
          const member = getMemberForEmail(user.email);
          if (!member) {
            await authModule.signOut(auth);
            callback({
              user: null,
              member: null,
              error: "这个账号不在共享账本白名单里，请先在配置里登记邮箱。",
            });
            return;
          }

          await ensureBookMembership(user, member);
          callback({ user, member, error: "" });
        } catch (error) {
          await authModule.signOut(auth).catch(() => {});
          callback({
            user: null,
            member: null,
            error: `同步账本失败：${error.message || "请检查 Firestore 规则。"}`,
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
