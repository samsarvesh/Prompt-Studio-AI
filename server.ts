import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("prompts.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS shared_prompts (
    id TEXT PRIMARY KEY,
    title TEXT,
    improved_prompt TEXT,
    explanation TEXT,
    created_at INTEGER
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/share", (req, res) => {
    const { title, improvedPrompt, explanation } = req.body;
    const id = Math.random().toString(36).substring(2, 10);
    const timestamp = Date.now();

    try {
      const stmt = db.prepare("INSERT INTO shared_prompts (id, title, improved_prompt, explanation, created_at) VALUES (?, ?, ?, ?, ?)");
      stmt.run(id, title, improvedPrompt, explanation, timestamp);
      res.json({ id });
    } catch (error) {
      console.error("Failed to save shared prompt:", error);
      res.status(500).json({ error: "Failed to share prompt" });
    }
  });

  app.get("/api/share/:id", (req, res) => {
    const { id } = req.params;
    try {
      const stmt = db.prepare("SELECT * FROM shared_prompts WHERE id = ?");
      const row = stmt.get(id) as any;
      if (row) {
        res.json({
          title: row.title,
          improvedPrompt: row.improved_prompt,
          explanation: row.explanation,
          timestamp: row.created_at
        });
      } else {
        res.status(404).json({ error: "Prompt not found" });
      }
    } catch (error) {
      console.error("Failed to retrieve shared prompt:", error);
      res.status(500).json({ error: "Failed to retrieve prompt" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
