import { GoogleGenAI } from "https://esm.run/@google/genai";

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
const btnLimparHistorico = document.getElementById("btn-limpar-historico");

// ===============================
// INICIALIZAÇÃO
// ===============================
window.addEventListener("DOMContentLoaded", () => {
    // Restaura chave da API salva no navegador
    const savedKey = localStorage.getItem("pocketchef_gemini_key");
    if (savedKey && inputApiKey) {
        inputApiKey.value = savedKey;
    }
    
    // Carrega receitas salvas localmente
    carregarReceitasLocais();
});

// Guardar API Key localmente quando o utilizador digitar
if (inputApiKey) {
    inputApiKey.addEventListener("change", () => {
        localStorage.setItem("pocketchef_gemini_key", inputApiKey.value.trim());
    });
}

// Limpar histórico
if (btnLimparHistorico) {
    btnLimparHistorico.addEventListener("click", () => {
        if (confirm("Tem certeza que deseja apagar todas as receitas salvas?")) {
            localStorage.removeItem("pocketchef_receitas_salvas");
            carregarReceitasLocais();
        }
    });
}

// ===============================
// GERAR RECEITA (INTEGRAÇÃO GEMINI)
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
                <p>
                    <i class='bx bx-loader-alt bx-spin'></i>
                    O PocketChef está a preparar a sua receita...
                </p>
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

            const textoReceita = response.text || "Não foi possível estruturar o texto da receita.";

            containerResultado.innerHTML = `
                <div class="recipe-container">
                    <h2 class="recipe-title"><i class='bx bx-dish'></i> Sua Receita PocketChef</h2>
                    <div class="recipe-content">
                        ${textoReceita.replace(/\n/g, "<br>")}
                    </div>
                    <button id="btn-salvar-receita" class="btn-principal" style="margin-top: 20px;">
                        <i class='bx bx-bookmark-plus'></i> Salvar no Livro de Receitas
                    </button>
                </div>
            `;

            const btnSalvar = document.getElementById("btn-salvar-receita");
            if (btnSalvar) {
                btnSalvar.addEventListener("click", () => {
                    salvarReceitaLocal(ingredientes, textoReceita);
                });
            }

        } catch (erro) {
            console.error("Erro ao gerar receita:", erro);
            containerResultado.innerHTML = `
                <div class="loading-state" style="color: #ff6b4a;">
                    <p>
                        <i class='bx bx-error-circle'></i>
                        Erro ao gerar a receita. Verifique se a sua API Key é válida.
                    </p>
                </div>
            `;
        }
    });
}

// ===============================
// LOCALSTORAGE: ARMAZENAMENTO LOCAL
// ===============================
function salvarReceitaLocal(ingredientesDigitados, conteudoFormatado) {
    const receitasAtuais = JSON.parse(localStorage.getItem("pocketchef_receitas_salvas") || "[]");
    
    const novaReceita = {
        id: Date.now(),
        titulo: `Receita com ${ingredientesDigitados}`,
        conteudo: conteudoFormatado
    };

    receitasAtuais.unshift(novaReceita); // Adiciona no início da lista
    localStorage.setItem("pocketchef_receitas_salvas", JSON.stringify(receitasAtuais));

    alert("Receita salva com sucesso!");
    carregarReceitasLocais();
}

function carregarReceitasLocais() {
    if (!listaHistorico) return;

    const receitasAtuais = JSON.parse(localStorage.getItem("pocketchef_receitas_salvas") || "[]");

    if (receitasAtuais.length === 0) {
        listaHistorico.innerHTML = `
            <div class="historico-item vazio">
                <p>Nenhuma receita salva ainda. Crie sua primeira receita!</p>
            </div>
        `;
        if (historicoCount) historicoCount.textContent = "0 salvas";
        return;
    }

    listaHistorico.innerHTML = "";
    
    receitasAtuais.forEach((receita) => {
        const card = document.createElement("div");
        card.className = "historico-item";
        card.style.cssText = "padding: 12px; background: var(--surface-input); border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); cursor: pointer; margin-bottom: 8px;";
        card.innerHTML = `
            <h4 style="font-size: 0.85rem; color: var(--brand-yellow); margin-bottom: 4px;">${receita.titulo}</h4>
            <p style="font-size: 0.75rem; color: var(--color-text-secondary);"><i class='bx bx-book-open'></i> Clique para visualizar</p>
        `;

        card.addEventListener("click", () => {
            containerResultado.classList.remove("hidden");
            containerResultado.innerHTML = `
                <div class="recipe-container">
                    <h2 class="recipe-title"><i class='bx bx-book-bookmark'></i> ${receita.titulo}</h2>
                    <div class="recipe-content">
                        ${receita.conteudo.replace(/\n/g, "<br>")}
                    </div>
                </div>
            `;
        });

        listaHistorico.appendChild(card);
    });

    if (historicoCount) {
        historicoCount.textContent = `${receitasAtuais.length} salva${receitasAtuais.length > 1 ? 's' : ''}`;
    }
}
