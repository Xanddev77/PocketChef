import { GoogleGenAI } from "https://esm.run/@google/genai";

import { auth, db, provider } from "./firebase.js";

import {
    cadastrar,
    login,
    loginGoogle,
    recuperarSenha,
    sair,
    verificarLogin
} from "./auth.js";


// ===============================
// ELEMENTOS DA IA
// ===============================

const btnGerar = document.getElementById("btn-gerar");
const inputIngredientes = document.getElementById("ingredientes");
const selectTempo = document.getElementById("tempo");
const selectRefeicao = document.getElementById("refeicao");
const containerResultado = document.getElementById("resultado-container");


// ===============================
// ELEMENTOS LOGIN
// ===============================

const loginModal = document.getElementById("login-modal");

const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");

const btnClose = document.getElementById("close-modal");

const btnEntrar = document.getElementById("btn-email-login");
const btnGoogle = document.getElementById("btn-google-login");
const btnCriarConta = document.getElementById("btn-register");
const btnEsqueci = document.getElementById("btn-forgot");

const emailInput = document.getElementById("login-email");
const senhaInput = document.getElementById("login-password");

const nomeUsuario = document.getElementById("user-name");
const emailUsuario = document.getElementById("user-email");


// ===============================
// MODAL LOGIN
// ===============================

btnLogin.addEventListener("click",()=>{

    loginModal.classList.remove("hidden");

});

btnClose.addEventListener("click",()=>{

    loginModal.classList.add("hidden");

});

window.addEventListener("click",(e)=>{

    if(e.target===loginModal){

        loginModal.classList.add("hidden");

    }

});


// ===============================
// BOTÕES LOGIN
// ===============================

btnEntrar.addEventListener("click",()=>{

    login(
        emailInput.value,
        senhaInput.value
    );

});

btnCriarConta.addEventListener("click",()=>{

    cadastrar(
        emailInput.value,
        senhaInput.value
    );

});

btnGoogle.addEventListener("click",()=>{

    loginGoogle();

});

btnLogout.addEventListener("click",()=>{

    sair();

});

btnEsqueci.addEventListener("click",()=>{

    recuperarSenha(emailInput.value);

});

// ===============================
// OBSERVA O LOGIN DO USUÁRIO
// ===============================

verificarLogin((user)=>{

    if(user){

        nomeUsuario.textContent =
            user.displayName || "Chef";

        emailUsuario.textContent =
            user.email;

        btnLogin.classList.add("hidden");
        btnLogout.classList.remove("hidden");

        loginModal.classList.add("hidden");

        console.log("Usuário logado:",user.email);

    }else{

        nomeUsuario.textContent =
            "Visitante";

        emailUsuario.textContent =
            "Faça login para sincronizar suas receitas";

        btnLogin.classList.remove("hidden");
        btnLogout.classList.add("hidden");

        console.log("Nenhum usuário logado");

    }

});


// ===============================
// GERAR RECEITA
// ===============================

btnGerar.addEventListener("click", async ()=>{

    const chaveUsuario =
        document
        .getElementById("input-chave-api")
        .value
        .trim();

    const ingredientes =
        inputIngredientes.value.trim();

    const tempo =
        selectTempo.value;

    const tipoRefeicao =
        selectRefeicao.value;

    const radioMarcado =
        document.querySelector(
            'input[name="restricao"]:checked'
        );

    const restricao =
        radioMarcado
        ? radioMarcado.value
        : "Nenhuma";

    if(!chaveUsuario){

        alert("Cole sua Gemini API Key.");

        return;

    }

    if(!ingredientes){

        alert("Informe pelo menos um ingrediente.");

        return;

    }

    const ai =
        new GoogleGenAI({

            apiKey:chaveUsuario

        });

    containerResultado.classList.remove("hidden");

    containerResultado.innerHTML=`

        <div class="loading-state">

            <p>

                <i class='bx bx-loader-alt bx-spin'></i>

                PocketChef está criando sua receita...

            </p>

        </div>

`;
    try {

        const response = await ai.models.generateContent({

            model: "gemini-2.5-flash",

            contents: `
            Crie uma receita utilizando:

            Ingredientes: ${ingredientes}

            Tempo máximo: ${tempo}

            Tipo de refeição: ${tipoRefeicao}

            Restrição alimentar: ${restricao}
            `

        });

        const texto = response.text;

        containerResultado.innerHTML = `

            <div class="recipe-container">

                <h2>Sua Receita</h2>

                <div class="recipe-content">

                    ${texto.replace(/\n/g,"<br>")}

                </div>

            </div>

        `;

    } catch (erro) {

        console.error(erro);

        containerResultado.innerHTML = `

            <div class="loading-state">

                <p>

                    <i class='bx bx-error-circle'></i>

                    Erro ao gerar a receita.

                </p>

            </div>

        `;

    }

});