import React, { useState } from "react";
import { uid } from "../lib/storage.js";

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function Circulation({ books, loans, issueBook, returnLoan }) {
  const available = books.filter((b) => b.available > 0);
  const [bookId, setBookId] = useState(available[0]?.id || "");
  const [borrower, setBorrower] = useState("");
  const [days, setDays] = useState(14);

  const activeLoans = [...loans].filter((l) => !l.returnedAt).sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  const returnedLoans = [...loans].filter((l) => l.returnedAt).sort((a, b) => new Date(b.returnedAt) - new Date(a.returnedAt));

  function handleIssue() {
    if (!bookId) return alert("No book selected");
    if (!borrower.trim()) return alert("Enter a borrower name");
    const book = books.find((b) => b.id === bookId);
    if (!book || book.available <= 0) return alert("No copies available");
    issueBook({
      id: uid("ln"),
      bookId,
      bookTitle: book.title,
      borrower: borrower.trim(),
      borrowedAt: new Date().toISOString(),
      dueAt: new Date(Date.now() + Math.max(1, Number(days) || 14) * 86400000).toISOString(),
      returnedAt: null
    });
    setBorrower("");
  }

  return (
    <section>
      <div className="card">
        <h2>Issue a book</h2>
        <label>Book</label>
        <select value={bookId} onChange={(e) => setBookId(e.target.value)}>
          {available.length === 0 ? (
            <option value="">No copies available</option>
          ) : (
            available.map((b) => (
              <option key={b.id} value={b.id}>{b.title} ({b.available} left)</option>
            ))
          )}
        </select>
        <label>Borrower name</label>
        <input value={borrower} onChange={(e) => setBorrower(e.target.value)} placeholder="e.g. Ibrahim Yusuf (student)" />
        <label>Loan period (days)</label>
        <input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} />
        <button className="btn" style={{ marginTop: 14 }} onClick={handleIssue}>Issue book</button>
      </div>

      <div className="card">
        <h2>Active loans</h2>
        {activeLoans.length === 0 ? (
          <div className="empty">No active loans.</div>
        ) : (
          activeLoans.map((l) => {
            const overdue = new Date(l.dueAt) < new Date();
            return (
              <div className="loan" key={l.id}>
                <div>
                  <div className="l-title">{l.bookTitle}</div>
                  <div className="l-sub">{l.borrower} · borrowed {fmtDate(l.borrowedAt)} · due {fmtDate(l.dueAt)}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className={`badge ${overdue ? "overdue" : "ontime"}`}>{overdue ? "overdue" : "on time"}</span>
                  <button className="btn small" onClick={() => returnLoan(l.id)}>Mark returned</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="card">
        <h2>Return history</h2>
        {returnedLoans.length === 0 ? (
          <div className="empty">No return history yet.</div>
        ) : (
          returnedLoans.slice(0, 10).map((l) => (
            <div className="loan" key={l.id}>
              <div>
                <div className="l-title">{l.bookTitle}</div>
                <div className="l-sub">{l.borrower} · returned {fmtDate(l.returnedAt)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
