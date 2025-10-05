// OpenRouter AI API integration
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const API_URL = import.meta.env.VITE_OPENROUTER_API_URL;

export const openRouterAPI = {
  async getSuggestions(prompt, context = '') {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'MediControl - Medical Management App'
        },
        body: JSON.stringify({
          model: 'openai/gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Você é um assistente médico especializado em medicamentos e diagnósticos. ${context}`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Nenhuma sugestão disponível';
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      return 'Erro ao obter sugestões. Tente novamente.';
    }
  },

  async analyzeMedication(medicationName, diseaseName) {
    const prompt = `Analise o medicamento "${medicationName}" para o tratamento de "${diseaseName}". 
    Forneça informações sobre eficácia, dosagem recomendada, possíveis efeitos colaterais e contraindicações. 
    Responda de forma concisa e profissional.`;
    
    return this.getSuggestions(prompt, 'Forneça informações médicas precisas e seguras.');
  },

  async suggestMedications(diseaseName) {
    const prompt = `Sugira medicamentos comuns e eficazes para o tratamento de "${diseaseName}". 
    Liste 3-5 opções com nomes comerciais e genéricos, se possível.`;
    
    return this.getSuggestions(prompt, 'Sugira apenas medicamentos aprovados e seguros.');
  },

  async checkInteractions(medications) {
    const medicationList = medications.join(', ');
    const prompt = `Verifique possíveis interações medicamentosas entre: ${medicationList}. 
    Identifique interações importantes e forneça alertas de segurança.`;
    
    return this.getSuggestions(prompt, 'Foque em segurança e interações clinicamente relevantes.');
  }
};