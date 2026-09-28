// Simple localStorage-backed persistence for books & loans.
// Swap this out for a real backend (REST API / Firebase / Supabase) later —
// every function here just needs to keep the same shape and signature.

const LS_BOOKS = "nitt_lib_books";
const LS_LOANS = "nitt_lib_loans";

export function uid(prefix) {
  return prefix + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function loadBooks() {
  try {
    return JSON.parse(localStorage.getItem(LS_BOOKS) || "[]");
  } catch {
    return [];
  }
}

export function loadLoans() {
  try {
    return JSON.parse(localStorage.getItem(LS_LOANS) || "[]");
  } catch {
    return [];
  }
}

export function saveBooks(books) {
  localStorage.setItem(LS_BOOKS, JSON.stringify(books));
}

export function saveLoans(loans) {
  localStorage.setItem(LS_LOANS, JSON.stringify(loans));
}

export function seedDemoData() {
  const demoBooks = [
    { title: "Introduction to Railway Signalling", author: "A. Musa", category: "Transport Engineering", description: "A foundational text on signalling systems used in rail transport networks.", copies: 3 },
    { title: "Principles of Logistics Management", author: "K. Adeyemi", category: "Logistics", description: "Covers core logistics and supply chain concepts for transport institutions.", copies: 2 },
    { title: "Fundamentals of Electrical Circuits", author: "R. Bello", category: "Electrical Engineering", description: "An introductory guide to circuit theory and analysis for engineering students.", copies: 4 },
    { title: "Transport Economics in Practice", author: "F. Okafor", category: "Economics", description: "Applies economic principles to transport planning and policy decisions.", copies: 1 },
    { title: "Safety Systems in Public Transport", author: "N. Ibrahim", category: "Safety Engineering", description: "Explores safety standards and risk management across transport modes.", copies: 2 }
  ].map((d) => ({
    id: uid("bk"),
    ...d,
    available: d.copies,
    addedAt: new Date().toISOString()
  }));

  const loans = [];
  if (demoBooks[0]) {
    const b = demoBooks[0];
    loans.push({
      id: uid("ln"),
      bookId: b.id,
      bookTitle: b.title,
      borrower: "Chidi Nwosu (student)",
      borrowedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      dueAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      returnedAt: null
    });
    b.available -= 1;
  }

  saveBooks(demoBooks);
  saveLoans(loans);
  return { books: demoBooks, loans };
}

export function daysBetween(a, b) {
  return Math.round((new Date(b) - new Date(a)) / 86400000);
}
