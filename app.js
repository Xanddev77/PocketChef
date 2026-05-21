import { GoogleGenAI } from 'https://esm.run/@google/genai';

// Seleção de elementos da árvore DOM do HTML
const btnGerar = document.getElementById('btn-gerar');
const inputIngredientes = document.getElementById('ingredientes');
const selectTempo = document.getElementById('tempo');
const selectRefeicao = document.getElementById('refeicao');
const containerResultado = document.getElementById('resultado-container');

// Evento principal disparado ao clicar no botão de gerar receita
btnGerar.addEventListener('click', async () => {
  
  // 1. Captura a chave de segurança inserida na tela pelo usuário/apresentador
  const chaveUsuario = document.getElementById('input-chave-api').value.trim();
  
  // Captura dos demais filtros do formulário gourmet
  const ingredientes = inputIngredientes.value.trim();
  const tempo = selectTempo.value;
  const tipoRefeicao = selectRefeicao.value;
  
  // Captura qual chip de restrição alimentar está marcado
  const radioMarcado = document.querySelector('input[name="restricao"]:checked');
  const restricao = radioMarcado ? radioMarcado.value : "Nenhuma";

  /* ==========================================================================
     VALIDAÇÕES DE SEGURANÇA INTERNA
     ========================================================================== */
  if (!chaveUsuario) {
    alert("⚠️ Acesso Negado: Por favor, cole sua Gemini API Key no campo do topo da página para ativar o robô!");
    return;
  }

  if (!ingredientes) {
    alert("Por favor, informe pelo menos um ingrediente para o Chef!");
    return;
  }

  /* ==========================================================================
     INICIALIZAÇÃO DO SDK DO GEMINI COM A CHAVE INFORMADA VIA FRONT-END
     ========================================================================== */
  const ai = new GoogleGenAI({ apiKey: chaveUsuario });

  // Ativa a área visual de carregamento (feedback de processamento assíncrono)
  containerResultado.classList.remove('hidden');
  containerResultado.innerHTML = `
    <div class="loading-state">
      <p><i class='bx bx-loader-alt bx-spin'></i> O Chef Inteligente está inventando sua receita... ⏳</p>
    </div>
  `;

  try {
    // Chamada oficial à API do Gemini utilizando o modelo estável 2.5 Flash
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Crie uma receita utilizando estritamente estes ingredientes: ${ingredientes}. 
                 Tipo de refeição configurada: ${tipoRefeicao}. 
                 Tempo limite de preparo: ${tempo}. 
                 Restrição ou preferência alimentar ativa: ${restricao}.`,
      config: {
        systemInstruction: `Você é um Chef executivo renomado, focado em alta gastronomia e aproveitamento de ingredientes domésticos. 
        Você deve gerar um nome elegante para a receita e estimar a quantidade aproximada de calorias e macros.`,
        
        // Garante que o retorno do modelo venha em uma estrutura JSON limpa e previsível
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            nomePrato: { type: 'STRING' },
            tempoFinal: { type: 'STRING', description: 'Ex: 20 min' },
            calorias: { type: 'STRING', description: 'Ex: 410 kcal' },
            carboidratos: { type: 'STRING', description: 'Ex: 35g' },
            proteinas: { type: 'STRING', description: 'Ex: 28g' },
            passos: { type: 'ARRAY', items: { type: 'STRING' } }
          },
          required: ['nomePrato', 'tempoFinal', 'calorias', 'carboidratos', 'proteinas', 'passos']
        }
      }
    });

    // Transforma a string de texto JSON purificada do Gemini em Objeto manipulável pelo JS
    const receita = JSON.parse(response.text);

    // Injeta a estrutura semântica final com os ícones do Boxicons alinhados ao CSS premium
    containerResultado.innerHTML = `
      <article class="recipe-container">
        <h2 class="recipe-title">${receita.nomePrato}</h2>
        
        <div class="meta-row">
          <span class="badge badge-time"><i class='bx bx-stopwatch'></i> Pronto em: ${receita.tempoFinal}</span>
          <span class="badge badge-diet"><i class='bx bx-purchase-tag-alt'></i> ${restricao}</span>
        </div>

        <div class="nutrition-grid">
          <div class="macro-box">
            <i class='bx bx-bolt-circle'></i>
            <span>Calorias</span>
            <strong>${receita.calorias}</strong>
          </div>
          <div class="macro-box">
            <i class='bx bx-cookie'></i>
            <span>Carbos</span>
            <strong>${receita.carboidratos}</strong>
          </div>
          <div class="macro-box">
            <i class='bx bx-dna'></i>
            <span>Proteínas</span>
            <strong>${receita.proteinas}</strong>
          </div>
        </div>

        <h3 class="section-title">Modo de Preparo</h3>
        <ol class="steps-list">
          ${receita.passos.map(passo => `<li>${passo}</li>`).join('')}
        </ol>
      </article>
    `;

  } catch (error) {
    console.error("Falha técnica de comunicação com a API do Gemini:", error);
    containerResultado.innerHTML = `
      <div class="loading-state" style="color: var(--brand-orange);">
        <p><i class='bx bx-error-circle'></i> Erro na requisição. Verifique se a sua chave colada no campo superior é válida e tente de novo.</p>
      </div>
    `;
  }
});
