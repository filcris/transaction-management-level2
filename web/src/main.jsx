import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!API_URL) {
      setError({
        error: "CONFIG_ERROR",
        message: "VITE_API_URL is not defined. Please set it in web/.env",
      });
      return;
    }

    const amtNum = Number(amount);

    try {
      const res = await fetch(`${API_URL}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: accountId,
          amount: amtNum,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data);
        return;
      }

      // buscar saldo atualizado
      const balRes = await fetch(`${API_URL}/accounts/${accountId}`);
      const balData = await balRes.json();

      const newTx = {
        transaction_id: data.transaction_id,
        account_id: accountId,
        amount: amtNum,
        balance: balData.balance,
      };

      // adiciona a nova transação no topo
      setTransactions((prev) => [newTx, ...prev]);

      // MUITO IMPORTANTE PARA O CYPRESS:
      // limpar campos depois de submit
      setAmount("");
      setAccountId("");
    } catch (err) {
      setError({
        error: "NETWORK_ERROR",
        message: err.message,
      });
    }
  }

  return (
    <div className="app">
      <div className="window">
        <h1 className="window__title">Transaction Manager</h1>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="card">
          <div className="card__title">New Transaction</div>

          <label className="label">
            Account ID
            <input
              className="input"
              data-type="account-id"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="UUID"
            />
          </label>

          <label className="label">
            Amount
            <input
              className="input"
              data-type="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 15 or -3"
            />
          </label>

          <div className="row">
            <button className="btn" data-type="transaction-submit">
              Submit
            </button>
          </div>

          {error && (
            <div className="error">
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                Something went wrong
              </div>
              <div style={{ fontSize: 11, marginBottom: 2 }}>
                {error.error}
              </div>
              {error.message && (
                <div style={{ fontSize: 11 }}>{error.message}</div>
              )}

              <details style={{ marginTop: 6 }}>
                <summary style={{ cursor: "pointer" }}>
                  Technical details
                </summary>
                <pre style={{ margin: 0, fontSize: 10 }}>
                  {JSON.stringify(error, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </form>

        {/* HISTORY */}
        <div className="card" style={{ marginTop: 20 }}>
          <div className="card__title">
            Transaction History{" "}
            <span className="history__badge">{transactions.length}</span>
          </div>

          {transactions.length === 0 && (
            <p className="helper">No transactions yet</p>
          )}

          {transactions.map((tx) => (
            <div
              key={tx.transaction_id}
              className={`tx ${
                tx.amount >= 0 ? "tx--deposit" : "tx--withdraw"
              }`}
              data-type="transaction"
              data-account-id={tx.account_id}
              data-amount={tx.amount}
              data-balance={tx.balance}
            >
              <div className="tx__tag">
                {tx.amount >= 0 ? "Deposit" : "Withdraw"}
              </div>

              <div style={{ fontSize: 13 }}>
                <strong>Amount:</strong>{" "}
                <span className="amountBox">{tx.amount}</span>
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                }}
                className={tx.balance >= 0 ? "balance--pos" : "balance--neg"}
              >
                Balance: {tx.balance}
              </div>

              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>
                {tx.transaction_id}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);







