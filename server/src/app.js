// src/app.js
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// ===== DB SETUP (in-memory por omissão; ficheiro se vier em env) =====
const dbPath = process.env.DATABASE_PATH && process.env.DATABASE_PATH.trim() !== ''
  ? process.env.DATABASE_PATH
  : ':memory:';

if (dbPath !== ':memory:') {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export const db = new Database(dbPath);
db.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS accounts (
    id   TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS transactions (
    id         TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    amount     INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE
  );
`);

// Seed de conta (apenas se não existir nenhuma)
let existing = db.prepare('SELECT id FROM accounts LIMIT 1').get();
export const defaultAccountId = existing?.id ?? uuidv4();
if (!existing) {
  db.prepare('INSERT INTO accounts (id, name) VALUES (?, ?)').run(defaultAccountId, 'Default');
}

// ===== APP SETUP =====
export const app = express();
app.use(cors());
app.use(express.json());

// ===== SCHEMAS =====
const createTxSchema = z.object({
  account_id: z.string().uuid(),
  amount: z.number().int()
});

// ===== HEALTHCHECK (conforme teste) =====
app.get('/ping', (_req, res) => res.status(200).send('pong'));

// ===== TRANSACTIONS =====

// POST /transactions  -> cria conta automaticamente se não existir
// Resposta: 201 { transaction_id, account_id, amount, created_at }
app.post('/transactions', (req, res) => {
  const parsed = createTxSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'INVALID_INPUT',
      details: parsed.error.flatten()
    });
  }

  const { account_id, amount } = parsed.data;

  // criar conta se não existir (o teste gera UUID aleatório)
  const acc = db.prepare('SELECT id FROM accounts WHERE id = ?').get(account_id);
  if (!acc) {
    db.prepare('INSERT INTO accounts (id, name) VALUES (?, ?)').run(account_id, 'Auto');
  }

  const id = uuidv4();
  db.prepare(
    'INSERT INTO transactions (id, account_id, amount) VALUES (?, ?, ?)'
  ).run(id, account_id, amount);

  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id);

  return res.status(201).json({
    transaction_id: tx.id,
    account_id: tx.account_id,
    amount: tx.amount,
    created_at: tx.created_at
  });
});

// GET /transactions/:id  -> { transaction_id, account_id, amount, created_at }
app.get('/transactions/:id', (req, res) => {
  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  if (!tx) return res.status(404).json({ error: 'Transaction not found' });

  return res.json({
    transaction_id: tx.id,
    account_id: tx.account_id,
    amount: tx.amount,
    created_at: tx.created_at
  });
});

// (opcional) GET /transactions?account_id=...  -> histórico (não é usado no Cypress, mas útil)
app.get('/transactions', (req, res) => {
  const { account_id } = req.query;
  if (!account_id) return res.status(400).json({ error: 'account_id is required' });
  const acc = db.prepare('SELECT id FROM accounts WHERE id = ?').get(account_id);
  if (!acc) return res.status(404).json({ error: 'Account not found' });
  const txs = db.prepare(
    'SELECT * FROM transactions WHERE account_id = ? ORDER BY datetime(created_at) DESC'
  ).all(account_id);
  return res.json({ items: txs });
});

// ===== ACCOUNTS =====

// GET /accounts/:id  -> { account_id, balance }
app.get('/accounts/:id', (req, res) => {
  const { id } = req.params;
  const acc = db.prepare('SELECT id FROM accounts WHERE id = ?').get(id);

  // Se não existir, devolvemos balance 0 (o Cypress só chama depois de criar transações, mas isto é resiliente)
  if (!acc) {
    return res.status(200).json({ account_id: id, balance: 0 });
  }

  const row = db.prepare(
    'SELECT COALESCE(SUM(amount), 0) AS balance FROM transactions WHERE account_id = ?'
  ).get(id);

  return res.json({ account_id: id, balance: row.balance });
});

app.get('/seed-account', (_req, res) => {
  res.json({ account_id: defaultAccountId });
});
export default app;