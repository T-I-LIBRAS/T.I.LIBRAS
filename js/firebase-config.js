import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyAvFAwzGzYmT3SIyLuuwDTmhA1qLqPZMN4",
  authDomain: "ti-libras.firebaseapp.com",
  projectId: "ti-libras",
  storageBucket: "ti-libras.firebasestorage.app",
  messagingSenderId: "423213417346",
  appId: "1:423213417346:web:71fe7d508a43e1c380459b",
  measurementId: "G-X1G9JG9K4D"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
export { firebaseConfig, app, auth, db };
