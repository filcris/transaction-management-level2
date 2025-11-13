import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import request from "supertest";
import app from "../src/app.js"; // agora com export default app

// helper para criar conta através de transação
async function createAccountAndTransaction(amount = 7) {
  const accountId = crypto.randomUUID();
  const res = await request(app)
    .post("/transactions")
    .send({ account_id: accountId, amount });

  assert.equal(res.statusCode, 201);
  assert.ok(res.body.transaction_id);

  return { accountId, transactionId: res.body.transaction_id };
}

test("GET /ping (healthcheck) returns 200", async () => {
  const res = await request(app).get("/ping");
  assert.equal(res.statusCode, 200);
});

test("POST /transactions validates input (invalid uuid and amount)", async () => {
  // invalid uuid
  const res1 = await request(app)
    .post("/transactions")
    .send({ account_id: "not-a-uuid", amount: 10 });

  assert.equal(res1.statusCode, 400);

  // invalid amount
  const res2 = await request(app)
    .post("/transactions")
    .send({ account_id: crypto.randomUUID(), amount: "abc" });

  assert.equal(res2.statusCode, 400);
});

test("POST /transactions creates new account and transaction", async () => {
  const accountId = crypto.randomUUID();

  const res = await request(app)
    .post("/transactions")
    .send({ account_id: accountId, amount: 7 });

  assert.equal(res.statusCode, 201);
  assert.ok(res.body.transaction_id);

  // check account balance
  const accRes = await request(app).get(`/accounts/${accountId}`);
  assert.equal(accRes.statusCode, 200);
  assert.equal(accRes.body.account_id, accountId);
  assert.equal(accRes.body.balance, 7);
});

test("Create two transactions on same account and check balance and history", async () => {
  const accountId = crypto.randomUUID();

  // first transaction: +10
  const res1 = await request(app)
    .post("/transactions")
    .send({ account_id: accountId, amount: 10 });

  assert.equal(res1.statusCode, 201);
  const firstId = res1.body.transaction_id;

  // second transaction: -3
  const res2 = await request(app)
    .post("/transactions")
    .send({ account_id: accountId, amount: -3 });

  assert.equal(res2.statusCode, 201);
  const secondId = res2.body.transaction_id;

  // balance should be 7
  const accRes = await request(app).get(`/accounts/${accountId}`);
  assert.equal(accRes.statusCode, 200);
  assert.equal(accRes.body.balance, 7);

  // assuming you implemented GET /transactions/:id as Cypress expects
  const tx1 = await request(app).get(`/transactions/${firstId}`);
  assert.equal(tx1.statusCode, 200);
  assert.equal(tx1.body.account_id, accountId);
  assert.equal(tx1.body.amount, 10);

  const tx2 = await request(app).get(`/transactions/${secondId}`);
  assert.equal(tx2.statusCode, 200);
  assert.equal(tx2.body.account_id, accountId);
  assert.equal(tx2.body.amount, -3);
});


