import { GoogleGenAI } from "https://esm.run/@google/genai";
import { auth, db, provider } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

let usuarioAtual = null;

// ===============================
// ELEMENTOS DO DOM
// ===============================
const btnGerar = document.getElementById("btn-gerar");
const inputIngredientes = document.getElementById("ingredientes");
const selectTempo = document.getElementById("tempo");
const selectRefeicao = document.getElementById("refeicao");
const containerResultado = document.getElementById("resultado-container");
const inputApiKey = document.getElementById("input-chave-api");
const listaHistorico = document.getElementById("lista-receitas-salvas");
const historicoCount = document.getElementById("historico-count");

// Modal & Auth Elements
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
// INICIALIZAÇÃO
// ===============================
window.addEventListener("DOMContentLoaded", () => {
    const splash = document.getElementById("splash-screen");
    if (splash) {
        splash.classList.add("fade-out");
        setTimeout(() => splash.style.display = "none", 500);
    }

    const savedKey = localStorage.getItem("pocketchef_gemini_key");
    if (savedKey && inputApiKey) {
        inputApiKey.value = savedKey;
    }
});

if (inputApiKey) {
    inputApiKey.addEventListener("change", () => {
        localStorage.setItem("pocketchef_gemini_key", inputApiKey.value.trim());
    });
}

// ===============================
// CONTROLO DO MODAL
// ===============================
if (btnLogin) btnLogin.addEventListener("click", () => loginModal.classList.remove("hidden"));
if (btnClose) btnClose.addEventListener("click", () => loginModal.classList.add("hidden"));
window.addEventListener("click", (e) => { 
    if (e.target === loginModal) loginModal.classList.add("hidden"); 
});

// ===============================
// AÇÕES DE AUTENTICAÇÃO DIRECTAS
// ===============================

// 1. Entrar com E-mail e Senha
if (btnEntrar) {
    btnEntrar.addEventListener("click", async () => {
        const email = emailInput ? emailInput.value.trim() : "";
        const senha = senhaInput ? senhaInput.value.trim() : "";

        if (!email || !senha) {
            alert("Por favor, preencha o e-mail e a senha.");
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, senha);
            alert("Login realizado com sucesso!");
            loginModal.classList.add("hidden");
        } catch (error) {
            alert("Erro no login: " + error.message);
        }
    });
}

// 2. Criar Nova Conta
if (btnCriarConta) {
    btnCriarConta.addEventListener("click", async () => {
        const email = emailInput ? emailInput.value.trim() : "";
        const senha = senhaInput ? senhaInput.value.trim() : "";

        if (!email || !senha) {
            alert("Por favor, preencha o e-mail e a senha.");
            return;
        }

        if (senha.length < 6) {
            alert("A senha deve ter pelo menos 6 caracteres.");
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, senha);
            alert("Conta criada com sucesso!");
            loginModal.classList.add("hidden");
        } catch (error) {
            alert("Erro ao criar conta: " + error.message);
        }
    });
}

// 3. Entrar com Google
if (btnGoogle) {
    btnGoogle.addEventListener("click", async () => {
        try {
            await signInWithPopup(auth, provider);
            alert("Bem-vindo ao PocketChef!");
            loginModal.classList.add("hidden");
        } catch (error) {
            alert("Erro na autenticação do Google: " + error.message);
        }
    });
}

// 4. Terminar Sessão (Logout)
if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
        try {
            await signOut(auth);
            alert("Sessão terminada.");
        } catch (error) {
            alert("Erro ao sair: " + error.message);
        }
    });
}

// 5. Recuperar Senha
if (btnEsqueci) {
    btnEsqueci.addEventListener("click", async () => {
        const email = emailInput ? emailInput.value.trim() : "";
        if (!email) {
            alert("Digite o seu e-mail no campo antes de clicar em recuperar senha.");
            return;
        }
        try {
            await sendPasswordResetEmail(auth, email);
            alert("Enviamos um e-mail de recuperação.");
        } catch (error) {
            alert("Erro: " + error.message);
        }
    });
}

// ===============================
// MONITOR DE ESTADO DO UTILIZADOR
// ===============================
onAuthStateChanged(auth, (user) => {
    usuarioAtual = user;
    if (user) {
        if (nomeUsuario) nomeUsuario.textContent = user.displayName || "Chef";
        if (emailUsuario) emailUsuario.textContent = user.email;
        if (btnLogin) btnLogin.classList.add("hidden");
        if (btnLogout) btnLogout.classList.remove("hidden");
        if (loginModal) loginModal.classList.add("hidden");

        carregarReceitasSalvas(user.uid);
    } else {
        if (nomeUsuario) nomeUsuario.textContent = "Visitante";
        if (emailUsuario) emailUsuario.textContent = "Faça login para sincronizar suas receitas";
        if (btnLogin) btnLogin.classList.remove("hidden");
        if (btnLogout) btnLogout.classList.add("hidden");

        renderizarHistoricoVazio();
    }
});

// ===============================
// GERAR RECEITA (GEMINI API)
// ===============================
if (btnGerar) {
    btnGerar.addEventListener("click", async () => {
        const chaveUsuario = inputApiKey.value.trim();
        const ingredientes = inputIngredientes.value.trim();
        const tempo = selectTempo.value;
        const tipoRefeicao = selectRefeicao.value;

        const radioMarcado = document.querySelector('input[name="restricao"]:checked');
        const restricao = radioMarcado ? radioMarcado.value : "Nenhuma";

        if (!chaveUsuario) {
            alert("Cole sua Gemini API Key no campo indicado no topo.");
            return;
        }

        if (!ingredientes) {
            alert("Informe pelo menos um ingrediente no campo.");
            return;
        }

        localStorage.setItem("pocketchef_gemini_key", chaveUsuario);

        containerResultado.classList.remove("hidden");
        containerResultado.innerHTML = `
            <div class="loading-state">
                <p><i class='bx bx-loader-alt bx-spin'></i> O PocketChef está a preparar a sua receita...</p>
            </div>
        `;

        try {
            const ai = new GoogleGenAI({ apiKey: chaveUsuario });

            const promptText = `
                Você é um chef especialista focado em combate ao desperdício alimentar.
                Crie uma receita prática e bem explicada com os seguintes detalhes:
                - Ingredientes disponíveis: ${ingredientes}
                - Tempo máximo de preparo: ${tempo}
                - Tipo de refeição: ${tipoRefeicao}
                - Restrição alimentar: ${restricao}

                Estruture a resposta com:
                1. Nome Prático da Receita
                2. Lista Completa de Ingredientes
                3. Modo de Preparo Passo a Passo
            `;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: promptText
            });

            const textoReceita = response.text || "Não foi possível gerar a receita.";

            containerResultado.innerHTML = `
                <div class="recipe-container">
                    <h2 class="recipe-title"><i class='bx bx-dish'></i> Sua Receita PocketChef</h2>
                    <div class="recipe-content">
                        ${textoReceita.replace(/\n/g, "<br>")}
                    </div>
                    ${usuarioAtual ? `
                        <button id="btn-salvar-receita" class="btn-principal" style="margin-top: 20px;">
                            <i class='bx bx-bookmark-plus'></i> Salvar no Livro de Receitas
                        </button>
                    ` : `
                        <p style="margin-top: 15px; font-size: 0.85rem; color: var(--color-text-muted);">
                            <i class='bx bx-info-circle'></i> Faça login para poder guardar esta receita.
                        </p>
                    `}
                </div>
            `;

            const btnSalvar = document.getElementById("btn-salvar-receita");
            if (btnSalvar) {
                btnSalvar.addEventListener("click", () => {
                    salvarReceitaNoFirestore(ingredientes, textoReceita);
                });
            }

        } catch (erro) {
            console.error("Erro ao gerar receita:", erro);
            containerResultado.innerHTML = `
                <div class="loading-state" style="color: #ff6b4a;">
                    <p><i class='bx bx-error-circle'></i> Erro ao gerar a receita. Verifique se a sua API Key é válida.</p>
                </div>
            `;
        }
    });
}

// ===============================
// FIRESTORE: SALVAR E CARREGAR
// ===============================
async function salvarReceitaNoFirestore(ingredientesDigitados, conteudoFormatado) {
    if (!usuarioAtual) {
        alert("Você precisa estar logado para salvar receitas.");
        return;
    }

    try {
        await addDoc(collection(db, "receitas"), {
            userId: usuarioAtual.uid,
            titulo: `Receita com ${ingredientesDigitados}`,
            conteudo: conteudoFormatado,
            criadoEm: serverTimestamp()
        });

        alert("Receita salva com sucesso!");
        carregarReceitasSalvas(usuarioAtual.uid);

    } catch (e) {
        console.error("Erro ao salvar no Firestore:", e);
        alert("Não foi possível salvar a receita.");
    }
}

async function carregarReceitasSalvas(userId) {
    if (!listaHistorico) return;

    try {
        const q = query(
            collection(db, "receitas"),
            where("userId", "==", userId)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            renderizarHistoricoVazio();
            return;
        }

        listaHistorico.innerHTML = "";
        let quantidade = 0;

        querySnapshot.forEach((docSnap) => {
            quantidade++;
            const data = docSnap.data();

            const card = document.createElement("div");
            card.className = "historico-item";
            card.style.cssText = "padding: 12px; background: var(--surface-input); border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); cursor: pointer; margin-bottom: 8px;";
            card.innerHTML = `
                <h4 style="font-size: 0.85rem; color: var(--brand-yellow); margin-bottom: 4px;">${data.titulo}</h4>
                <p style="font-size: 0.75rem; color: var(--color-text-secondary);"><i class='bx bx-book-open'></i> Clique para visualizar</p>
            `;

            card.addEventListener("click", () => {
                containerResultado.classList.remove("hidden");
                containerResultado.innerHTML = `
                    <div class="recipe-container">
                        <h2 class="recipe-title"><i class='bx bx-book-bookmark'></i> ${data.titulo}</h2>
                        <div class="recipe-content">
                            ${data.conteudo.replace(/\n/g, "<br>")}
                        </div>
                    </div>
                `;
            });

            listaHistorico.appendChild(card);
        });

        if (historicoCount) {
            historicoCount.textContent = `${quantidade} salva${quantidade > 1 ? 's' : ''}`;
        }

    } catch (e) {
        console.error("Erro ao buscar histórico:", e);
    }
}

function renderizarHistoricoVazio() {
    if (listaHistorico) {
        listaHistorico.innerHTML = `
            <div class="historico-item vazio">
                <p>Nenhuma receita salva ainda.</p>
            </div>
        `;
    }
    if (historicoCount) historicoCount.textContent = "0 salvas";
}
