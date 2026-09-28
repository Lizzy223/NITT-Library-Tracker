// Thin client for the AI backend (see /server/index.js).
// If the backend isn't running, these fail gracefully and the UI
// falls back to manual entry / keyword search.

const API_BASE = import.meta.env.VITE_AI_API_BASE || "http://localhost:8787";

async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`AI request failed: ${res.status}`);
  return res.json();
}

export async function aiSuggestMetadata(title, author) {
  try {
    return await postJson("/api/ai/suggest", { title, author });
  } catch (e) {
    console.warn("AI suggest failed", e);
    return null;
  }
}

export async function aiSearch(query, books) {
  try {
    return await postJson("/api/ai/search", { query, books });
  } catch (e) {
    console.warn("AI search failed", e);
    return null;
  }
}

export async function aiChat(question, books, loans) {
  try {
    const result = await postJson("/api/ai/chat", { question, books, loans });
    return result.text;
  } catch (e) {
    console.warn("AI chat failed", e);
    return "Sorry, I can't reach the AI backend right now. Make sure the server (npm run server) is running.";
  }
}
