/**
 * Servidor local de Auditoria de Produtos
 * - Roda em qualquer PC com Node.js 18+
 * - Banco SQLite (arquivo dados.db gerado automaticamente)
 * - Fotos salvas na pasta ./fotos/
 * - Aceita conexões da rede local (Wi-Fi do mercado)
 *
 * Como rodar (no PC Windows):
 *   1) Instale Node.js: https://nodejs.org (versão LTS)
 *   2) Abra o Prompt de Comando dentro desta pasta
 *   3) npm install
 *   4) npm start
 *   5) Anote o IP exibido (ex: http://192.168.1.10:4000)
 *   6) No app do celular, vá em Configurações > Servidor e cole esse endereço
 */

const express = require("express");
const cors = require("cors");
const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");
const os = require("os");

const PORT = 4000;
const DATA_DIR = __dirname;
const DB_PATH = path.join(DATA_DIR, "dados.db");
const FOTOS_DIR = path.join(DATA_DIR, "fotos");

if (!fs.existsSync(FOTOS_DIR)) fs.mkdirSync(FOTOS_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// --- Schema ----------------------------------------------------------------
db.exec(`
CREATE TABLE IF NOT EXISTS sessoes (
  id TEXT PRIMARY KEY,
  nome TEXT,
  criado_em TEXT NOT NULL,
  total INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS produtos (
  id TEXT PRIMARY KEY,
  sessao_id TEXT NOT NULL,
  codigo TEXT NOT NULL,
  codigo_barras TEXT,
  descricao TEXT NOT NULL,
  quantidade REAL NOT NULL,
  status TEXT NOT NULL,
  qtd_encontrada REAL,
  auditor TEXT,
  data TEXT,
  na_area_venda INTEGER NOT NULL DEFAULT 0,
  area_venda_auditor TEXT,
  area_venda_data TEXT,
  foto_id TEXT,
  atualizado_em TEXT NOT NULL,
  FOREIGN KEY (sessao_id) REFERENCES sessoes(id)
);

CREATE INDEX IF NOT EXISTS idx_produtos_codigo ON produtos(codigo);
CREATE INDEX IF NOT EXISTS idx_produtos_sessao ON produtos(sessao_id);
CREATE INDEX IF NOT EXISTS idx_produtos_status ON produtos(status);

CREATE TABLE IF NOT EXISTS fotos (
  id TEXT PRIMARY KEY,
  arquivo TEXT NOT NULL,
  mime TEXT NOT NULL,
  tamanho INTEGER NOT NULL,
  criado_em TEXT NOT NULL
);
`);

// --- App -------------------------------------------------------------------
const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));
app.use("/fotos", express.static(FOTOS_DIR));

// Serve o frontend (pasta ./public com o build do app React)
const PUBLIC_DIR = path.join(DATA_DIR, "public");
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
}

app.get("/api/ping", (_req, res) => {
  res.json({ ok: true, app: "auditoria-server", versao: "1.0.0" });
});

// --- Sessões ---------------------------------------------------------------
app.get("/api/sessoes", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT s.*,
        (SELECT COUNT(*) FROM produtos WHERE sessao_id = s.id AND status = 'found') AS encontrados,
        (SELECT COUNT(*) FROM produtos WHERE sessao_id = s.id AND status = 'not_found') AS nao_encontrados,
        (SELECT COUNT(*) FROM produtos WHERE sessao_id = s.id AND status = 'pending') AS pendentes,
        (SELECT COUNT(*) FROM produtos WHERE sessao_id = s.id AND na_area_venda = 1) AS na_area
      FROM sessoes s
      ORDER BY criado_em DESC`,
    )
    .all();
  res.json(rows);
});

app.post("/api/sessoes", (req, res) => {
  const { id, nome, criado_em, total } = req.body || {};
  if (!id || !criado_em) return res.status(400).json({ error: "id e criado_em obrigatórios" });
  db.prepare(
    `INSERT OR REPLACE INTO sessoes (id, nome, criado_em, total) VALUES (?,?,?,?)`,
  ).run(id, nome || null, criado_em, total || 0);
  res.json({ ok: true });
});

app.get("/api/sessoes/:id/produtos", (req, res) => {
  const rows = db
    .prepare(`SELECT * FROM produtos WHERE sessao_id = ? ORDER BY codigo`)
    .all(req.params.id);
  res.json(rows.map(rowToProduto));
});

app.delete("/api/sessoes/:id", (req, res) => {
  db.prepare(`DELETE FROM produtos WHERE sessao_id = ?`).run(req.params.id);
  db.prepare(`DELETE FROM sessoes WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

// --- Produtos --------------------------------------------------------------
app.post("/api/produtos/upsert", (req, res) => {
  const list = Array.isArray(req.body) ? req.body : [req.body];
  const stmt = db.prepare(`
    INSERT INTO produtos (
      id, sessao_id, codigo, codigo_barras, descricao, quantidade,
      status, qtd_encontrada, auditor, data,
      na_area_venda, area_venda_auditor, area_venda_data, foto_id, atualizado_em
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET
      codigo=excluded.codigo,
      codigo_barras=excluded.codigo_barras,
      descricao=excluded.descricao,
      quantidade=excluded.quantidade,
      status=excluded.status,
      qtd_encontrada=excluded.qtd_encontrada,
      auditor=excluded.auditor,
      data=excluded.data,
      na_area_venda=excluded.na_area_venda,
      area_venda_auditor=excluded.area_venda_auditor,
      area_venda_data=excluded.area_venda_data,
      foto_id=COALESCE(excluded.foto_id, produtos.foto_id),
      atualizado_em=excluded.atualizado_em
  `);
  const tx = db.transaction((items) => {
    for (const p of items) {
      stmt.run(
        p.id,
        p.sessaoId,
        p.codigo,
        p.codigoBarras || null,
        p.descricao,
        Number(p.quantidade) || 0,
        p.status,
        p.qtdEncontrada == null ? null : Number(p.qtdEncontrada),
        p.auditor || null,
        p.data || null,
        p.naAreaVenda ? 1 : 0,
        p.areaVendaAuditor || null,
        p.areaVendaData || null,
        p.fotoId || null,
        new Date().toISOString(),
      );
    }
  });
  tx(list);
  res.json({ ok: true, count: list.length });
});

// Histórico de um código (recorrência)
app.get("/api/historico/:codigo", (req, res) => {
  const rows = db
    .prepare(
      `SELECT p.*, s.nome AS sessao_nome, s.criado_em AS sessao_data
       FROM produtos p
       LEFT JOIN sessoes s ON s.id = p.sessao_id
       WHERE p.codigo = ?
       ORDER BY p.atualizado_em DESC`,
    )
    .all(req.params.codigo);
  res.json(rows.map(rowToProduto));
});

// Recorrência: produtos que mais aparecem ou que mais ficam pendentes
app.get("/api/recorrencia", (req, res) => {
  const status = req.query.status; // 'pending' | 'not_found' | 'all'
  const where =
    status && status !== "all"
      ? `WHERE status = '${status === "pending_or_missing" ? "pending' OR status = 'not_found" : status}'`
      : "";
  const rows = db
    .prepare(
      `SELECT codigo, descricao,
        COUNT(*) AS ocorrencias,
        SUM(CASE WHEN status='not_found' THEN 1 ELSE 0 END) AS vezes_nao_encontrado,
        SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS vezes_pendente,
        SUM(CASE WHEN status='found' THEN 1 ELSE 0 END) AS vezes_encontrado,
        SUM(CASE WHEN na_area_venda=1 THEN 1 ELSE 0 END) AS vezes_na_area,
        MAX(atualizado_em) AS ultima
      FROM produtos
      ${where}
      GROUP BY codigo, descricao
      ORDER BY ocorrencias DESC, vezes_nao_encontrado DESC
      LIMIT 500`,
    )
    .all();
  res.json(rows);
});

// --- Fotos -----------------------------------------------------------------
// Upload via JSON base64 (simples e funciona em qualquer rede)
app.post("/api/fotos", (req, res) => {
  const { id, dataUrl } = req.body || {};
  if (!id || !dataUrl) return res.status(400).json({ error: "id e dataUrl obrigatórios" });
  const m = /^data:(image\/[a-zA-Z+]+);base64,(.+)$/.exec(dataUrl);
  if (!m) return res.status(400).json({ error: "dataUrl inválida" });
  const mime = m[1];
  const ext = mime.split("/")[1].replace("jpeg", "jpg");
  const buf = Buffer.from(m[2], "base64");
  const arquivo = `${id}.${ext}`;
  fs.writeFileSync(path.join(FOTOS_DIR, arquivo), buf);
  db.prepare(
    `INSERT OR REPLACE INTO fotos (id, arquivo, mime, tamanho, criado_em) VALUES (?,?,?,?,?)`,
  ).run(id, arquivo, mime, buf.length, new Date().toISOString());
  res.json({ ok: true, id, url: `/fotos/${arquivo}`, tamanho: buf.length });
});

app.get("/api/fotos/:id", (req, res) => {
  const row = db.prepare(`SELECT * FROM fotos WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: "não encontrada" });
  res.json({ id: row.id, url: `/fotos/${row.arquivo}`, mime: row.mime, tamanho: row.tamanho });
});

// --- Helpers ---------------------------------------------------------------
function rowToProduto(r) {
  return {
    id: r.id,
    sessaoId: r.sessao_id,
    codigo: r.codigo,
    codigoBarras: r.codigo_barras || undefined,
    descricao: r.descricao,
    quantidade: r.quantidade,
    status: r.status,
    qtdEncontrada: r.qtd_encontrada == null ? undefined : r.qtd_encontrada,
    auditor: r.auditor || undefined,
    data: r.data || undefined,
    naAreaVenda: !!r.na_area_venda,
    areaVendaAuditor: r.area_venda_auditor || undefined,
    areaVendaData: r.area_venda_data || undefined,
    fotoId: r.foto_id || undefined,
    atualizadoEm: r.atualizado_em,
    sessaoNome: r.sessao_nome,
    sessaoData: r.sessao_data,
  };
}

// SPA fallback: qualquer rota não-API devolve o index.html do app
app.get(/^\/(?!api\/|fotos\/).*/, (_req, res, next) => {
  const indexPath = path.join(PUBLIC_DIR, "index.html");
  if (fs.existsSync(indexPath)) return res.sendFile(indexPath);
  next();
});

// --- Start -----------------------------------------------------------------
app.listen(PORT, "0.0.0.0", () => {
  const ips = [];
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) ips.push(iface.address);
    }
  }
  console.log("\n========================================");
  console.log("  Servidor de Auditoria iniciado!");
  console.log("========================================");
  console.log(`  Porta: ${PORT}`);
  console.log("  Endereços para usar no celular:");
  for (const ip of ips) console.log(`    →  http://${ip}:${PORT}`);
  if (ips.length === 0) console.log("    (nenhum IP de rede detectado)");
  console.log("========================================\n");
});
