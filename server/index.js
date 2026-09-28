// Minimal backend that proxies AI calls to the Anthropic API.
// The API key must live here, server-side — never in the React app.
//
// Setup:
//   1. npm install
//   2. export ANTHROPIC_API_KEY=sk-ant-...
//   3. npm run server        (runs on http://localhost:8787)
//   4. npm run dev           (runs the React app, calls this server)
//
// Swagger UI: http://localhost:8787/api-docs

import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const app = express();
app.use(cors());
app.use(express.json());

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "NITT Library Tracker — AI Backend",
      version: "1.0.0",
      description: "Express server that proxies AI calls to the Anthropic API for the NITT Zaria library tracking system."
    },
    servers: [{ url: "http://localhost:8787" }]
  },
  apis: ["./server/index.js"]
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-sonnet-4-6";

function extractJson(text) {
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

/**
 * @openapi
 * /api/ai/suggest:
 *   post:
 *     summary: Suggest a category and description for a book
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Introduction to Thermodynamics"
 *               author:
 *                 type: string
 *                 example: "John Smith"
 *     responses:
 *       200:
 *         description: AI-generated category and blurb
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   type: string
 *                   example: "Mechanical Engineering"
 *                 description:
 *                   type: string
 *                   example: "Covers fundamental principles of heat and energy transfer in engineering systems."
 *       500:
 *         description: AI suggestion failed
 */
app.post("/api/ai/suggest", async (req, res) => {
  const { title, author } = req.body;
  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `You are helping catalog a book for an academic library at a transport technology institute.
Book title: "${title}"
Author: "${author || "Unknown"}"
Respond ONLY with JSON: {"category": "<a short subject category, 2-4 words>", "description": "<a neutral, factual one-sentence library-catalog blurb, under 25 words, based on the likely subject matter of the title>"}`
        }
      ]
    });
    const text = msg.content.find((c) => c.type === "text")?.text || "{}";
    res.json(extractJson(text));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI suggestion failed" });
  }
});

/**
 * @openapi
 * /api/ai/search:
 *   post:
 *     summary: Natural-language search over the book catalog
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query, books]
 *             properties:
 *               query:
 *                 type: string
 *                 example: "books about civil engineering bridges"
 *               books:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:       { type: string }
 *                     title:    { type: string }
 *                     author:   { type: string }
 *                     category: { type: string }
 *                     available: { type: integer }
 *                     copies:   { type: integer }
 *     responses:
 *       200:
 *         description: Matching book IDs and a short explanation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 matches:
 *                   type: array
 *                   items: { type: string }
 *                   example: ["book-1", "book-4"]
 *                 note:
 *                   type: string
 *                   example: "Found 2 books related to structural engineering."
 *       500:
 *         description: AI search failed
 */
app.post("/api/ai/search", async (req, res) => {
  const { query, books } = req.body;
  const catalogSummary = books
    .map((b) => `${b.id} :: ${b.title} — ${b.author} [${b.category}] (${b.available}/${b.copies} available)`)
    .join("\n");
  try {
    const msg = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: `A library patron is searching a catalog. Their query: "${query}"

Catalog (id :: title — author [category] (available/copies)):
${catalogSummary || "(catalog is empty)"}

Return ONLY JSON: {"matches": ["<id1>", "<id2>", ...], "note": "<one short sentence explaining the match, or saying nothing matched>"}
Order matches by relevance. Include at most 8. If nothing is relevant, return an empty array.`
        }
      ]
    });
    const text = msg.content.find((c) => c.type === "text")?.text || "{}";
    res.json(extractJson(text));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI search failed" });
  }
});

/**
 * @openapi
 * /api/ai/chat:
 *   post:
 *     summary: Chat assistant with access to live catalog and loan data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question, books, loans]
 *             properties:
 *               question:
 *                 type: string
 *                 example: "Which books are overdue right now?"
 *               books:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:        { type: string }
 *                     title:     { type: string }
 *                     author:    { type: string }
 *                     category:  { type: string }
 *                     available: { type: integer }
 *                     copies:    { type: integer }
 *               loans:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     borrower:   { type: string }
 *                     bookTitle:  { type: string }
 *                     dueAt:      { type: string, format: date-time }
 *                     returnedAt: { type: string, format: date-time, nullable: true }
 *     responses:
 *       200:
 *         description: Assistant reply
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 text:
 *                   type: string
 *                   example: "There are 2 overdue books: ..."
 *       500:
 *         description: AI chat failed
 */
app.post("/api/ai/chat", async (req, res) => {
  const { question, books, loans } = req.body;

  const tools = [
    {
      name: "list_books",
      description: "List all books in the catalog with availability.",
      input_schema: { type: "object", properties: {} }
    },
    {
      name: "list_overdue_loans",
      description: "List all currently overdue, unreturned loans.",
      input_schema: { type: "object", properties: {} }
    },
    {
      name: "list_active_loans",
      description: "List all currently active (not yet returned) loans.",
      input_schema: { type: "object", properties: {} }
    }
  ];

  function runTool(name) {
    if (name === "list_books") {
      return books.map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        category: b.category,
        available: b.available,
        copies: b.copies
      }));
    }
    if (name === "list_overdue_loans") {
      const today = new Date();
      return loans
        .filter((l) => !l.returnedAt && new Date(l.dueAt) < today)
        .map((l) => ({
          borrower: l.borrower,
          book: l.bookTitle,
          dueAt: l.dueAt,
          daysOverdue: Math.round((today - new Date(l.dueAt)) / 86400000)
        }));
    }
    if (name === "list_active_loans") {
      return loans.filter((l) => !l.returnedAt).map((l) => ({ borrower: l.borrower, book: l.bookTitle, dueAt: l.dueAt }));
    }
    return null;
  }

  try {
    let messages = [
      {
        role: "user",
        content: `You are the AI assistant for the NITT Zaria library tracking system. Answer the librarian's question helpfully and concisely (a few sentences max unless a list is clearly needed). Use the provided tools to look up live data rather than guessing. Question: ${question}`
      }
    ];

    let response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 600,
      tools,
      messages
    });

    // Handle up to a few tool-use rounds
    let rounds = 0;
    while (response.stop_reason === "tool_use" && rounds < 4) {
      const toolUseBlocks = response.content.filter((c) => c.type === "tool_use");
      messages.push({ role: "assistant", content: response.content });
      messages.push({
        role: "user",
        content: toolUseBlocks.map((tu) => ({
          type: "tool_result",
          tool_use_id: tu.id,
          content: JSON.stringify(runTool(tu.name))
        }))
      });
      response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 600,
        tools,
        messages
      });
      rounds++;
    }

    const text = response.content.find((c) => c.type === "text")?.text || "Sorry, I couldn't process that.";
    res.json({ text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI chat failed" });
  }
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => console.log(`AI backend listening on http://localhost:${PORT}`));
