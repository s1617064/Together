export const firebaseRuntimeConfig = {
  enabled: true,
  sharedBookId: "dou-bao-home",
  project: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
  },
  members: [
    {
      key: "me",
      name: "抖",
      accentClass: "member-dou",
      email: "dou@example.com",
    },
    {
      key: "wife",
      name: "宝",
      accentClass: "member-bao",
      email: "bao@example.com",
    },
  ],
};
