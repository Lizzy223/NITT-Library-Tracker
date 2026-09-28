import React, { useState } from "react";
import { uid } from "../lib/storage.js";
import { aiSuggestMetadata, aiSearch } from "../lib/ai.js";
import { BookRow } from "./Dashboard.jsx";

export default function Catalog({ books, addBook, deleteBook }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [copies, setCopies] = useState(1);
  const [suggesting, setSuggesting] = useState(false);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchIds, setSearchIds] = useState(null);
  const [searchNote, setSearchNote] = useState("");

  async function handleSuggest() {
    if (!title.trim()) return alert("Enter a title first");
    setSuggesting(true);
    const res = await aiSuggestMetadata(title.trim(), author.trim());
    setSuggesting(false);
    if (res) {
      if (res.category) setCategory(res.category);
      if (res.description) setDescription(res.description);
    } else {
      alert("AI suggestion failed — you can fill this in manually.");
    }
  }

  function handleAdd() {
    if (!title.trim()) return alert("Title is required");
    addBook({
      id: uid("bk"),
      title: title.trim(),
      author: author.trim(),
      category: category.trim(),
      description: description.trim(),
      copies: Math.max(1, Number(copies) || 1),
      available: Math.max(1, Number(copies) || 1),
      addedAt: new Date().toISOString()
    });
    setTitle(""); setAuthor(""); setCategory(""); setDescription(""); setCopies(1);
  }

  function handleKeywordSearch(q) {
    setQuery(q);
    setSearchNote("");
    if (!q.trim()) { setSearchIds(null); return; }
    const lower = q.toLowerCase();
    setSearchIds(
      books.filter((b) =>
        b.title.toLowerCase().includes(lower) ||
        (b.author || "").toLowerCase().includes(lower) ||
        (b.category || "").toLowerCase().includes(lower)
      ).map((b) => b.id)
    );
  }

  async function handleAiSearch() {
    if (!query.trim()) return alert("Type what you're looking for first");
    setSearching(true);
    const res = await aiSearch(query.trim(), books);
    setSearching(false);
    if (res && res.matches) {
      setSearchIds(res.matches);
      setSearchNote(res.note || `Found ${res.matches.length} match(es).`);
    } else {
      alert("AI search unavailable — showing keyword results instead");
    }
  }

  const displayed = searchIds ? books.filter((b) => searchIds.includes(b.id)) : books;
  const sorted = [...displayed].sort((a, b) => a.title.localeCompare(b.title));

  return (
    <section>
      <div className="card">
        <h2>Add a book <span className="ai-tag">AI-assisted</span></h2>
        <p className="hint">Enter a title and author — AI will suggest a category and a short blurb, which you can edit before saving.</p>
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Introduction to Railway Signalling" />
        <div className="row">
          <div>
            <label>Author</label>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="e.g. A. Musa" />
          </div>
          <div>
            <label>Copies</label>
            <input type="number" min="1" value={copies} onChange={(e) => setCopies(e.target.value)} />
          </div>
        </div>
        <label>Category</label>
        <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Leave blank to let AI suggest it" />
        <label>Description</label>
        <textarea rows="2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Leave blank to let AI draft one" />
        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
          <button className="btn secondary" onClick={handleSuggest} disabled={suggesting}>
            {suggesting ? "Thinking…" : "✨ AI-suggest category & blurb"}
          </button>
          <button className="btn" onClick={handleAdd}>Add to catalog</button>
        </div>
      </div>

      <div className="card">
        <h2>Search catalog</h2>
        <p className="hint">Try natural language — "beginner books on electronics" or "anything by Musa".</p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={query}
            onChange={(e) => handleKeywordSearch(e.target.value)}
            placeholder="Search by title, author, category, or describe what you need…"
          />
          <button className="btn secondary" onClick={handleAiSearch} style={{ whiteSpace: "nowrap" }} disabled={searching}>
            {searching ? "Searching…" : "✨ AI search"}
          </button>
        </div>
        {searchNote && <div className="hint" style={{ marginTop: 8 }}>{searchNote}</div>}
      </div>

      <div className="card">
        <h2>All books</h2>
        <div className="book-list">
          {sorted.length === 0 ? (
            <div className="empty">{searchIds ? "No matches found." : "No books in the catalog yet."}</div>
          ) : (
            sorted.map((b) => <BookRow key={b.id} book={b} onDelete={deleteBook} />)
          )}
        </div>
      </div>
    </section>
  );
}
