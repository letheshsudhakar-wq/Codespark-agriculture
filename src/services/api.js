// AGRIWISE API Service Layer
// Connects frontend to Flask backend (RAG + Voice endpoints)
// Never exposes GEMINI_API_KEY in frontend code.

const API_BASE = import.meta.env.VITE_API_BASE || '';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });

  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = {};
  }

  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/** Health check */
export async function checkHealth() {
  return request('/api/health');
}

/** KB status */
export async function getKBStatus() {
  return request('/api/rag/status');
}

/** Semantic search only (no generation) */
export async function ragSearch(question, topK = 5) {
  return request('/api/rag/search', {
    method: 'POST',
    body: JSON.stringify({ question, top_k: topK }),
  });
}

/** Grounded QA with citations */
export async function ragAsk(question, topK = 5) {
  return request('/api/rag/ask', {
    method: 'POST',
    body: JSON.stringify({ question, top_k: topK }),
  });
}

/** Multilingual voice ask: translates non-English to English, RAGs, translates back */
export async function voiceAsk(question, languageCode, topK = 5) {
  return request('/api/voice/ask', {
    method: 'POST',
    body: JSON.stringify({ question, language_code: languageCode, top_k: topK }),
  });
}

// Maps UI language codes (en/kn/hi/ta) to voice API codes (en-IN/kn-IN/hi-IN/ta-IN)
export function uiLangToVoiceLang(lang) {
  const map = {
    en: 'en-IN',
    kn: 'kn-IN',
    hi: 'hi-IN',
    ta: 'ta-IN',
  };
  return map[lang] || 'en-IN';
}
