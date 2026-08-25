import { auth, provider } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";


// ===============================
// CADASTRAR
// ===============================

export async function cadastrar(email, senha){

    try{

        const usuario = await createUserWithEmailAndPassword(
            auth,
            email,
            senha
        );

        alert("Conta criada com sucesso!");

        return usuario;

    }catch(error){

        alert(error.message);

    }

}


// ===============================
// LOGIN EMAIL
// ===============================

export async function login(email, senha){

    try{

        const usuario = await signInWithEmailAndPassword(
            auth,
            email,
            senha
        );

        alert("Login realizado com sucesso!");

        return usuario;

    }catch(error){

        alert(error.message);

    }

}


// ===============================
// LOGIN GOOGLE
// ===============================

export async function loginGoogle(){

    try{

        const usuario = await signInWithPopup(
            auth,
            provider
        );

        alert("Bem-vindo ao PocketChef!");

        return usuario;

    }catch(error){

        alert(error.message);

    }

}


// ===============================
// RECUPERAR SENHA
// ===============================

export async function recuperarSenha(email){

    if(!email){

        alert("Digite seu e-mail primeiro.");

        return;

    }

    try{

        await sendPasswordResetEmail(auth,email);

        alert("Enviamos um e-mail para recuperação da senha.");

    }catch(error){

        alert(error.message);

    }

}


// ===============================
// LOGOUT
// ===============================

export async function sair(){

    try{

        await signOut(auth);

        alert("Logout realizado.");

    }catch(error){

        alert(error.message);

    }

}


// ===============================
// OBSERVAR USUÁRIO
// ===============================

export function verificarLogin(callback){

    onAuthStateChanged(auth,(user)=>{

        callback(user);

    });

}