import React, { useState, useEffect } from "react";
import Dashboard from "./components/Dashboard.jsx";
import Catalog from "./components/Catalog.jsx";
import Circulation from "./components/Circulation.jsx";
import Assistant from "./components/Assistant.jsx";
import { loadBooks, loadLoans, saveBooks, saveLoans, seedDemoData } from "./lib/storage.js";

const TABS = [
  { id: "dash", label: "Dashboard" },
  { id: "catalog", label: "Catalog" },
  { id: "circulation", label: "Borrow & Return" },
  { id: "assistant", label: "AI Assistant" }
];

export default function App() {
  const [tab, setTab] = useState("dash");
  const [books, setBooks] = useState([]);
  const [loans, setLoans] = useState([]);

  // Load (and seed on first run)
  useEffect(() => {
    let b = loadBooks();
    let l = loadLoans();
    if (b.length === 0 && l.length === 0) {
      const seeded = seedDemoData();
      b = seeded.books;
      l = seeded.loans;
    }
    setBooks(b);
    setLoans(l);
  }, []);

  // Persist on every change
  useEffect(() => { saveBooks(books); }, [books]);
  useEffect(() => { saveLoans(loans); }, [loans]);

  function addBook(book) {
    setBooks((prev) => [...prev, book]);
  }

  function deleteBook(id) {
    const book = books.find((b) => b.id === id);
    if (!book) return;
    if (!confirm(`Remove "${book.title}" from the catalog?`)) return;
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }

  function issueBook(loan) {
    setLoans((prev) => [...prev, loan]);
    setBooks((prev) => prev.map((b) => (b.id === loan.bookId ? { ...b, available: b.available - 1 } : b)));
  }

  function returnLoan(loanId) {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return;
    setLoans((prev) => prev.map((l) => (l.id === loanId ? { ...l, returnedAt: new Date().toISOString() } : l)));
    setBooks((prev) =>
      prev.map((b) => (b.id === loan.bookId ? { ...b, available: Math.min(b.copies, b.available + 1) } : b))
    );
  }

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          <div className="mark">📚</div>
          <div>
            <h1>NITT Library Tracker</h1>
            <div className="sub">AI-powered circulation &amp; catalog system</div>
          </div>
        </div>
        <div className="status-pill">local mode · data saved in this browser</div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? "active" : ""} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "dash" && <Dashboard books={books} loans={loans} />}
      {tab === "catalog" && <Catalog books={books} addBook={addBook} deleteBook={deleteBook} />}
      {tab === "circulation" && (
        <Circulation books={books} loans={loans} issueBook={issueBook} returnLoan={returnLoan} />
      )}
      {tab === "assistant" && <Assistant books={books} loans={loans} />}
    </div>
  );
}
