import React, { useState, useRef, useEffect } from "react";
import { aiChat } from "../lib/ai.js";

const CHIPS = [
  "What books are overdue right now?",
  "Recommend a book for someone interested in electronics.",
  "Give me a one-paragraph summary of the library's current state.",
  "Which books have no available copies?"
];

export default function Assistant({ books, loans }) {
  const [messages, setMessages] = useState([
    { who: "ai", text: "Hi! I'm your library assistant. Ask me anything about the catalog, loans, or for a recommendation." }
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages, pending]);

  async function send(question) {
    if (!question.trim() || pending) return;
    setMessages((m) => [...m, { who: "user", text: question }]);
    setInput("");
    setPending(true);
    const answer = await aiChat(question, books, loans);
    setPending(false);
    setMessages((m) => [...m, { who: "ai", text: answer }]);
  }

  return (
    <section>
      <div className="card">
        <h2>Ask the library assistant <span className="ai-tag">AI</span></h2>
        <p className="hint">Ask about the catalog, overdue books, or get a recommendation. The assistant looks up live data from this library.</p>
        <div className="suggest-chips">
          {CHIPS.map((c) => (
            <div className="chip" key={c} onClick={() => send(c)}>{c.length > 28 ? c.slice(0, 26) + "…" : c}</div>
          ))}
        </div>
        <div className="chat-box" ref={boxRef}>
          {messages.map((m, i) => (
            <div className={`msg ${m.who}`} key={i}>{m.text}</div>
          ))}
          {pending && <div className="msg ai pending">Thinking…</div>}
        </div>
        <div className="chat-input-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Ask a question…"
          />
          <button className="btn" onClick={() => send(input)} disabled={pending}>Send</button>
        </div>
      </div>
    </section>
  );
}
