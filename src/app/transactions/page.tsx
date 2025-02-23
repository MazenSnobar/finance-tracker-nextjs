"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Transaction = {
  id: number;
  amount: number;
  currency: string;
  category: string;
  description?: string;
};

export default function Transactions() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");

  // 🟢 Transaction form data (for adding & updating)
  const [formData, setFormData] = useState({
    id: null as number | null,
    amount: "",
    currency: "USD",
    category: "",
    description: "",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
    } else {
      fetchTransactions();
    }
  }, [session, status, router]);

  async function fetchTransactions() {
    try {
      const res = await fetch("/api/transactions", {
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok)
        throw new Error(`API request failed with status: ${res.status}`);

      const data = await res.json();
      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  }
  // ✅ Fetch exchange rate when currency changes
  async function fetchExchangeRate(from: string, to: string) {
    if (from === to) return 1; // No conversion needed

    try {
      const res = await fetch(`/api/transactions?baseCurrency=${from}`);
      const rates = await res.json();

      console.log("📊 Exchange Rates:", rates); // debugging

      if (!rates || !rates[to]) {
        throw new Error("Invalid exchange rate data");
      }

      return rates[to]; // Return the exchange rate for the requested currency
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      return null;
    }
  }

  // Fill form when clicking a transaction
  function handleTransactionClick(transaction: Transaction) {
    setFormData({
      id: transaction.id,
      amount: String(transaction.amount),
      currency: transaction.currency,
      category: transaction.category,
      description: transaction.description || "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formData.id) {
      // Update transaction
      try {
        const res = await fetch(`/api/transactions/${formData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: formData.amount,
            currency: formData.currency,
            category: formData.category,
            description: formData.description,
          }),
        });

        if (!res.ok) throw new Error("Failed to update transaction");

        setFormData({
          id: null,
          amount: "",
          currency: "USD",
          category: "",
          description: "",
        });
        fetchTransactions();
      } catch (error) {
        console.error("Error updating transaction:", error);
      }
    } else {
      // Add new transaction
      try {
        const res = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: formData.amount,
            currency: formData.currency,
            category: formData.category,
            description: formData.description,
          }),
        });

        if (!res.ok) throw new Error("Failed to add transaction");

        setFormData({
          id: null,
          amount: "",
          currency: "USD",
          category: "",
          description: "",
        });
        fetchTransactions();
      } catch (error) {
        console.error("Error adding transaction:", error);
      }
    }
  }
  async function handleDeleteTransaction(id: number) {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete transaction");

      setTransactions(transactions.filter((txn) => txn.id !== id)); // Remove the deleted transaction from UI
    } catch (error) {
      console.error("Error deleting transaction:", error);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-200 to-blue-400 p-8">
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-lg p-8">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-black">Transactions</h1>
          <button
            onClick={() => signOut()}
            className="bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        {/* Transaction Form (for both adding & updating) */}
        <form
          onSubmit={handleSubmit}
          className="bg-gray-100 p-6 rounded-lg mb-6"
        >
          <h2 className="text-xl font-semibold mb-4 text-black">
            {formData.id ? "✏ Edit Transaction" : "➕ Add New Transaction"}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="Amount"
              required
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              className="text-black p-3 border rounded-lg focus:ring focus:ring-blue-300"
            />
            <select
              value={formData.currency}
              onChange={async (e) => {
                const newCurrency = e.target.value;
                const exchangeRate = await fetchExchangeRate(
                  formData.currency,
                  newCurrency
                );

                if (exchangeRate !== null) {
                  setFormData((prevData) => ({
                    ...prevData,
                    currency: newCurrency,
                    amount: (
                      parseFloat(prevData.amount) * exchangeRate
                    ).toFixed(2), // Convert amount
                  }));
                }
              }}
              className="text-black p-3 border rounded-lg"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
            </select>
          </div>

          <div className="mt-4">
            <input
              type="text"
              placeholder="Category"
              required
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="text-black w-full p-3 border rounded-lg"
            />
          </div>

          <div className="mt-4">
            <input
              type="text"
              placeholder="Description (Optional)"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="text-black w-full p-3 border rounded-lg"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition mt-4"
          >
            {formData.id ? "Update Transaction" : "Add Transaction"}
          </button>
        </form>

        {/* Filter Input */}
        <input
          type="text"
          placeholder="🔎 Filter by category..."
          className="text-black w-full border p-3 rounded-lg shadow-sm focus:ring focus:ring-blue-300 mb-4"
          onChange={(e) => setCategoryFilter(e.target.value.toLowerCase())}
        />

        {/* Transactions List */}
        <div className="mt-4">
          {transactions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {transactions
                .filter((txn) =>
                  txn.category.toLowerCase().includes(categoryFilter)
                )
                .map((txn) => (
                  <motion.div
                    key={txn.id}
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => handleTransactionClick(txn)}
                    className="cursor-pointer flex justify-between items-center bg-gray-200 p-6 rounded-lg shadow-lg hover:bg-gray-300"
                  >
                    <div>
                      <p className="text-xl font-semibold text-blue-900">
                        ${txn.amount} {txn.currency}
                      </p>
                      <p className="text-md text-gray-700">{txn.category}</p>
                      {txn.description && (
                        <p className="text-sm text-gray-500">
                          {txn.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent triggering the edit action
                        handleDeleteTransaction(txn.id);
                      }}
                      className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </motion.div>
                ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 mt-4">
              No transactions found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
