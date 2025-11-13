import express from "express";
import cors from "cors";
import { randomUUID } from "crypto";

const app = express();
app.use(cors());
app.use(express.json());

// Estado em memória
const accounts = new Map();
const transactions = new Map();
const defaultAccountId = randomUUID();

// Helpers
const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const getBalance = (id) => accounts.get(id) ?? 0;

// Healthcheck
app.get("/ping", (_req, res) => res.status(200).send("pong"));

// Seed account
app.get("/seed-account", (_req, res) => res.json({ account_id: defaultAccountId }));

// Criar transação
app.post("/transactions", (req, res) => {
  const { account_id, amount } = req.body || {};

  if (typeof account_id !== "string" || !uuidV4.test(account_id)) {
    return res.status(400).json({
      error: "INVALID_INPUT",
      details: { formErrors: [], fieldErrors: { account_id: ["Invalid uuid"] } }
    });
  }
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return res.status(400).json({
      error: "INVALID_INPUT",
      details: { formErrors: [], fieldErrors: { amount: ["Invalid amount"] } }
    });
  }

  const transaction_id = randomUUID();
  transactions.set(transaction_id, { transaction_id, account_id, amount });
  const newBalance = getBalance(account_id) + amount;
  accounts.set(account_id, newBalance);

  return res.status(201).json({ transaction_id });
});

// Ler transação
app.get("/transactions/:id", (req, res) => {
  const tx = transactions.get(req.params.id);
  if (!tx) return res.status(404).json({ error: "TRANSACTION_NOT_FOUND" });
  return res.json(tx);
});

// Ler conta (retorna 0 se não existir)
app.get("/accounts/:id", (req, res) => {
  const id = req.params.id;
  return res.json({ account_id: id, balance: getBalance(id) });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`✅ API listening on http://localhost:${PORT}`));

