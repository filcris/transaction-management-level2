import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";

const API_URL =
  import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.trim() !== ""
    ? import.meta.env.VITE_API_URL
    : "http://localhost:4000";

function App() {
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    // Não bloquear o envio — deixamos o backend validar.
    // Mas convertemos para number apenas se for claramente numérico.
    let bodyAmount;
    const parsed = Number(amount);
    if (!Number.isFinite(parsed)) {
      // mantém string para o caso inválido (ex: "abc")
      bodyAmount = amount;
    } else {
      bodyAmount = parsed;
    }

    const payload = {
      account_id: accountId,
      amount: bodyAmount,
    };

    setSubmitting(true);
    try {
      // 1) Criar transação
      const res = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        // Erros de validação NÃO devem criar histórico (Cypress espera isso)
        let details = null;
        try {
          details = await res.json();
        } catch {
          // ignore
        }
        setError(
          details?.error === "INVALID_INPUT"
            ? "Invalid input. Please check account_id and amount."
            : "Something went wrong creating the transaction."
        );
        return;
      }

      const data = await res.json();
      const transactionId = data.transaction_id;
      const accId = data.account_id;
      const txAmount = data.amount;

      // 2) Buscar saldo atualizado
      const balanceRes = await fetch(`${API_URL}/accounts/${accId}`);
      const balanceData = await balanceRes.json();

      const balance = balanceData.balance;

      // 3) Atualizar histórico (novo primeiro)
      setTransactions((prev) => [
        {
          id: transactionId,
          account_id: accId,
          amount: txAmount,
          balance,
          created_at: data.created_at,
        },
        ...prev,
      ]);

      // limpar só o amount (o Cypress escreve o accountId outra vez)
      setAmount("");
      setAccountId("");
    } catch (err) {
      console.error(err);
      setError("Network error while creating transaction.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app">
      <h1>Transaction Management</h1>

      <form className="tx-form" onSubmit={handleSubmit}>
        <div className="field">
          <label>Account ID</label>
          <input
            type="text"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            data-type="account-id"
            placeholder="UUID"
          />
        </div>

        <div className="field">
          <label>Amount</label>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            data-type="amount"
            placeholder="e.g. 30 or -5"
          />
        </div>

        <button
          type="submit"
          data-type="transaction-submit"
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Add transaction"}
        </button>
      </form>

      {error && <div className="error-banner">{error}</div>}

      <section className="tx-history">
        <h2>Transactions</h2>
        {transactions.length === 0 && (
          <p className="empty">No transactions yet.</p>
        )}

        <ul className="tx-list">
          {transactions.map((tx) => (
            <li
              key={tx.id}
              className="tx-item"
              data-type="transaction"
              data-account-id={tx.account_id}
              data-amount={tx.amount}
              data-balance={tx.balance}
            >
              <div className="tx-main">
                <span className="tx-account">{tx.account_id}</span>
                <span className="tx-amount">Amount: {tx.amount}</span>
                <span className="tx-balance">Balance: {tx.balance}</span>
              </div>
              {tx.created_at && (
                <div className="tx-meta">Created at: {tx.created_at}</div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);








