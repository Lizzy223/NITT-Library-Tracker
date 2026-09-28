import React from "react";
import { daysBetween } from "../lib/storage.js";

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function Dashboard({ books, loans }) {
  const totalTitles = books.length;
  const totalCopies = books.reduce((s, b) => s + Number(b.copies || 0), 0);
  const activeLoans = loans.filter((l) => !l.returnedAt);
  const overdue = activeLoans.filter((l) => new Date(l.dueAt) < new Date());

  const stats = [
    { n: totalTitles, l: "Distinct titles" },
    { n: totalCopies, l: "Total copies" },
    { n: activeLoans.length, l: "Active loans" },
    { n: overdue.length, l: "Overdue" }
  ];

  const dueSorted = [...activeLoans].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt)).slice(0, 8);
  const recentBooks = [...books].sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0)).slice(0, 4);

  return (
    <section>
      <div className="grid-stats">
        {stats.map((s, i) => (
          <div className="stat" key={i}>
            <div className="n">{s.n}</div>
            <div className="l">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Overdue &amp; due soon</h2>
        <p className="hint">Loans that need attention, most urgent first.</p>
        {dueSorted.length === 0 ? (
          <div className="empty">No active loans.</div>
        ) : (
          dueSorted.map((l) => {
            const overdueNow = new Date(l.dueAt) < new Date();
            const dueSoon = !overdueNow && daysBetween(new Date().toISOString(), l.dueAt) <= 3;
            const badge = overdueNow ? (
              <span className="badge overdue">{daysBetween(l.dueAt, new Date().toISOString())}d overdue</span>
            ) : dueSoon ? (
              <span className="badge due">due in {daysBetween(new Date().toISOString(), l.dueAt)}d</span>
            ) : (
              <span className="badge ontime">on time</span>
            );
            return (
              <div className="loan" key={l.id}>
                <div>
                  <div className="l-title">{l.bookTitle}</div>
                  <div className="l-sub">{l.borrower} · due {fmtDate(l.dueAt)}</div>
                </div>
                {badge}
              </div>
            );
          })
        )}
      </div>

      <div className="card">
        <h2>Recently added</h2>
        <div className="book-list">
          {recentBooks.length === 0 ? (
            <div className="empty">No books yet — add one from the Catalog tab.</div>
          ) : (
            recentBooks.map((b) => <BookRow key={b.id} book={b} onDelete={null} />)
          )}
        </div>
      </div>
    </section>
  );
}

export function BookRow({ book, onDelete }) {
  const availClass = book.available <= 0 ? "out" : book.available <= Math.ceil(book.copies * 0.3) ? "low" : "ok";
  return (
    <div className="book">
      <div className="meta">
        <div className="title">{book.title}</div>
        <div className="by">{book.author || "Unknown author"}</div>
        <div className="tags">
          {book.category && <span className="tag">{book.category}</span>}
          <span className={`tag ${availClass}`}>{book.available}/{book.copies} available</span>
        </div>
        {book.description && <div className="hint" style={{ marginTop: 6 }}>{book.description}</div>}
      </div>
      {onDelete && (
        <div className="actions">
          <button className="btn small danger" onClick={() => onDelete(book.id)}>Remove</button>
        </div>
      )}
    </div>
  );
}
