const path = require("path");
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const { nanoid } = require("nanoid");
const db = require("./db");

const app = express();
const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

const CODE_LENGTH = 6;
const CUSTOM_CODE_RE = /^[a-zA-Z0-9_-]{3,32}$/;
const RESERVED_CODES = new Set(["api", "api-docs", "public", "favicon.ico"]);

app.use(express.json());

const openapiSpec = YAML.load(path.join(__dirname, "..", "openapi.yaml"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use(express.static(path.join(__dirname, "..", "public")));

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const insertLink = db.prepare(
  "INSERT INTO links (code, original_url) VALUES (?, ?)"
);
const getLink = db.prepare("SELECT * FROM links WHERE code = ?");
const listLinks = db.prepare(
  "SELECT * FROM links ORDER BY created_at DESC, rowid DESC"
);
const incrementClicks = db.prepare(
  "UPDATE links SET clicks = clicks + 1 WHERE code = ?"
);
const deleteLink = db.prepare("DELETE FROM links WHERE code = ?");

app.post("/api/shorten", (req, res) => {
  const { url, customCode } = req.body || {};

  if (!url || !isValidUrl(url)) {
    return res.status(400).json({ error: "Informe uma URL válida (http:// ou https://)." });
  }

  let code = customCode?.trim();

  if (code) {
    if (!CUSTOM_CODE_RE.test(code) || RESERVED_CODES.has(code)) {
      return res.status(400).json({
        error: "Alias inválido. Use de 3 a 32 caracteres: letras, números, - ou _.",
      });
    }
    if (getLink.get(code)) {
      return res.status(409).json({ error: "Esse alias já está em uso." });
    }
  } else {
    do {
      code = nanoid(CODE_LENGTH);
    } while (getLink.get(code));
  }

  insertLink.run(code, url);
  res.status(201).json({ code, shortUrl: `${BASE_URL}/${code}`, originalUrl: url });
});

app.get("/api/links", (req, res) => {
  const links = listLinks.all().map((link) => ({
    ...link,
    shortUrl: `${BASE_URL}/${link.code}`,
  }));
  res.json(links);
});

app.delete("/api/links/:code", (req, res) => {
  const result = deleteLink.run(req.params.code);
  if (result.changes === 0) {
    return res.status(404).json({ error: "Link não encontrado." });
  }
  res.status(204).end();
});

app.get("/:code", (req, res, next) => {
  const link = getLink.get(req.params.code);
  if (!link) return next();

  incrementClicks.run(link.code);
  res.redirect(302, link.original_url);
});

app.use((req, res) => {
  res.status(404).json({ error: "Não encontrado." });
});

module.exports = app;
