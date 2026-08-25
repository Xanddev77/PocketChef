// ===============================
// Firebase SDK
// ===============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";


// ===============================
// Configuração do Firebase
// ===============================

const firebaseConfig = {

  apiKey: "AIzaSyAO44g0JUMmHskILzwMv4jHtqFvC0UFzlA",

  authDomain: "pocket-chef-ai.firebaseapp.com",

  projectId: "pocket-chef-ai",

  storageBucket: "pocket-chef-ai.firebasestorage.app",

  messagingSenderId: "321783406404",

  appId: "1:321783406404:web:3f416df20ff436d72f0111"

};


// ===============================
// Inicialização
// ===============================

const app = initializeApp(firebaseConfig);


// ===============================
// Serviços
// ===============================

const auth = getAuth(app);

const db = getFirestore(app);

const provider = new GoogleAuthProvider();


// ===============================
// Exportações
// ===============================

export {

  auth,

  db,

  provider

};