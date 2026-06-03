// ============================================================
// PRIME KITS STORE — Firebase Configuration
// ============================================================
// SETUP: Replace placeholder values with your Firebase project config
// Firebase Console → Project Settings → General → Your apps → Config
// ============================================================

export const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// ============================================================
// TELEGRAM BOT — Get token from @BotFather, chat_id from @userinfobot
// ============================================================
export const TELEGRAM_CONFIG = {
  botToken: "YOUR_BOT_TOKEN",
  chatId:   "YOUR_CHAT_ID"
};

// ============================================================
// DO NOT EDIT BELOW THIS LINE
// ============================================================

import { initializeApp }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore }    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage }      from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";
import { getAuth }         from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const app     = initializeApp(FIREBASE_CONFIG);
const db      = getFirestore(app);
const storage = getStorage(app);
const auth    = getAuth(app);

export { app, db, storage, auth };
