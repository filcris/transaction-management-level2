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

    // amount -> número se possível, string se inválido (para o teste da validação)
    let bodyAmount;
    const parsed = Number(amount);
    if (!Number.isFinite(parsed)) {
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
      // 1) criar transação
      const res = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let details = null;
        try {
          details = await res.json();
        } catch {
          /* ignore */
        }

        if (details?.error === "INVALID_INPUT") {
          setError("Invalid input. Please check Account ID and Amount.");
        } else {
          setError("Something went wrong while creating transaction.");
        }
        return;
      }

      const data = await res.json();
      const transactionId = data.transaction_id;
      const accId = data.account_id;
      const txAmount = data.amount;

      // 2) saldo atual dessa conta
      const balanceRes = await fetch(`${API_URL}/accounts/${accId}`);
      const balanceData = await balanceRes.json();
      const balance = balanceData.balance;

      // 3) nova transação no TOPO da lista
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

      // limpar inputs (obrigatório pelo enunciado)
      setAccountId("");
      setAmount("");
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Network error while creating transaction.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="app-shell">
      <h1 className="app-title">Transaction Management</h1>

      <div className="layout">
        {/* FORMULÁRIO (esquerda) */}
        <section className="panel panel-form">
          <h2 className="panel-heading">Submit new transaction</h2>

          {/* ⚠️ Estrutura EXACTA pedida no enunciado */}
          <form onSubmit={handleSubmit} className="tx-form">
            <div className="field-group">
              <label htmlFor="account-id">Account ID:</label>
              <input
                id="account-id"
                type="text"
                placeholder="Account UUID"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                data-type="account-id"
              />
            </div>

            <div className="field-group">
              <label htmlFor="amount">Amount:</label>
              <input
                id="amount"
                type="text"
                placeholder="e.g. 30 or -5"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                data-type="amount"
              />
            </div>

            <div className="submit-wrapper">
              <input
                type="submit"
                value={submitting ? "Submitting..." : "Submit"}
                data-type="transaction-submit"
                disabled={submitting}
              />
            </div>
          </form>

          {error && (
            <div className="error-box">
              <strong>Something went wrong</strong>
              <div>{error}</div>
            </div>
          )}
        </section>

        {/* LISTA DE TRANSAÇÕES (direita) */}
        <section className="panel panel-history">
          <h2 className="panel-heading">Transaction history</h2>

          {transactions.length === 0 ? (
            <p className="empty-state">No transactions yet.</p>
          ) : (
            <div className="tx-list">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="tx-item"
                  data-type="transaction"
                  data-account-id={tx.account_id}
                  data-amount={tx.amount}
                  data-balance={tx.balance}
                >
                  <div className="tx-line">
                    Transferred{" "}
                    <span
                      className={
                        "tx-amount " +
                        (tx.amount >= 0
                          ? "tx-amount-deposit"
                          : "tx-amount-withdraw")
                      }
                    >
                      {tx.amount}
                    </span>{" "}
                    {tx.amount >= 0 ? "to" : "from"} account{" "}
                    <span className="tx-account">{tx.account_id}</span>
                  </div>
                  <div className="tx-balance">
                    The current account balance is{" "}
                    <span className="tx-balance-value">{tx.balance}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);










