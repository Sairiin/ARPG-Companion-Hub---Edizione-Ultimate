// js/firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBBb-T8EEAGk203ANzajLkNvyoo17STTus",
  authDomain: "arpg-companion-hub.firebaseapp.com",
  projectId: "arpg-companion-hub",
  storageBucket: "arpg-companion-hub.firebasestorage.app",
  messagingSenderId: "992359528045",
  appId: "1:992359528045:web:f1776114a695399237b164",
  measurementId: "G-R7EDZCSZN2"
};

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase offline.", e);
}

export { auth, db };

export let currentUser = null;

export function getAuthModules() {
  return { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged };
}

export async function syncFromFirebase(userBuildsRef) {
  if (!currentUser || !db) return;
  try {
    const docSnap = await getDoc(doc(db, "users", currentUser.uid));
    if (docSnap.exists()) {
      const loaded = docSnap.data().builds || { poe1: [], poe2: [], d2: [], le: [], d4: [] };
      // Copia i dati nell'oggetto passato per riferimento
      ['poe1', 'poe2', 'd2', 'le', 'd4'].forEach(game => {
        userBuildsRef[game] = loaded[game] || [];
      });
    } else {
      await setDoc(doc(db, "users", currentUser.uid), { builds: userBuildsRef });
    }
  } catch (e) {
    console.error("syncFromFirebase error:", e);
  }
}

export async function syncToFirebase(userBuildsRef) {
  if (currentUser && db) {
    try {
      await setDoc(doc(db, "users", currentUser.uid), { builds: userBuildsRef }, { merge: true });
    } catch (e) {
      console.error("syncToFirebase error:", e);
    }
  } else {
    localStorage.setItem('arpgBuildHub', JSON.stringify(userBuildsRef));
  }
}

// Listener per auth state (callback esterna opzionale)
let onAuthStateChangeCallback = null;

export function setOnAuthStateChangeCallback(callback) {
  onAuthStateChangeCallback = callback;
}

if (auth) {
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (onAuthStateChangeCallback) {
      await onAuthStateChangeCallback(user);
    }
  });
}