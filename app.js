// app.js - Logica principale e Firebase

// 1. IMPORTIAMO I DATI DAL NOSTRO DATABASE ESTERNO
import { newsData, colorsData, smartLinksDB, runewordsData, RUNE_IMG_BASE_URL, RUNE_IMG_EXT } from './database.js';

// 2. CONFIGURAZIONE FIREBASE
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
    console.log("Firebase Inizializzato con successo!");
} catch(e) {
    console.warn("Firebase non configurato o errore. L'app funzionerà in modalità Solo Locale.", e);
}

// --- DA QUI IN POI, COPIA TUTTO IL RESTO DEL TUO JAVASCRIPT ---
// (Copia da "let currentUser = null;" fino alla fine del tag </script> del tuo file originale)

// NOTA BENE: quando copi la tua funzione window.updateTicker e window.fetchAndDisplayBuilds, 
// non avrai più bisogno di dichiarare newsData, smartLinksDB ecc. perché li abbiamo importati in cima!
// --- FUNZIONI ENCICLOPEDIA MECCANICHE ---

window.openLightbox = function(imgSrc) {
    document.getElementById('lightbox').classList.add('active');
    document.getElementById('lightbox-img').src = imgSrc;
    document.body.style.overflow = 'hidden';
};

window.closeLightbox = function(event) {
    // Chiude solo se si clicca fuori dall'immagine o sulla X
    if (event && event.target.id !== 'lightbox' && !event.target.classList.contains('lightbox-close')) return;
    document.getElementById('lightbox').classList.remove('active');
    document.body.style.overflow = 'auto';
};

// Chiudi Lightbox con tasto ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const lb = document.getElementById('lightbox');
        if(lb && lb.classList.contains('active')){
            lb.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
});

window.filterSelection = function(c) {
    var x, i;
    x = document.getElementsByClassName("card");
    var btns = document.getElementsByClassName("filter-btn");
    
    // Rimuove la classe active da tutti i bottoni
    for (i = 0; i < btns.length; i++) {
        btns[i].classList.remove("active");
    }
    
    // Aggiunge active al bottone cliccato
    if (event && event.target && event.target.classList.contains('filter-btn')) {
        event.target.classList.add("active");
    }

    if (c == "all") c = "";
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
        if (x[i].className.indexOf(c) > -1) {
            x[i].style.display = "flex";
        }
    }
};

window.openEncModal = function(id) {
    document.getElementById(id).style.display = 'flex';
    document.body.style.overflow = 'hidden'; 
};

window.closeEncModalById = function(id) {
    document.getElementById(id).style.display = 'none';
    document.body.style.overflow = 'auto'; 
};

window.closeEncModal = function(event) {
    if (event.target.classList.contains('modal-overlay')) {
        event.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};
