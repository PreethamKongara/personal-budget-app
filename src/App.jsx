import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Pencil,
  Download,
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Home,
  Utensils,
  Receipt,
  Repeat,
  Send,
  X,
  Check,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const STORAGE_KEY = "personal-budget-app-v1";

const defaultCategories = [
  "Rent",
  "Groceries",
  "Bills",
  "Subscriptions",
  "Credit Card Payment",
  "TFSA",
  "RRSP",
  "FHSA",
  "Family Transfer",
  "Debt",
  "Investments",
  "Dining",
  "Travel",
  "Other",
];

const categoryIcons = {
  Rent: Home,
  Groceries: Utensils,
  Bills: Receipt,
  Subscriptions: Repeat,
  "Credit Card Payment": CreditCard,
  TFSA: PiggyBank,
  RRSP: PiggyBank,
  FHSA: PiggyBank,
  "Family Transfer": Send,
  Debt: CreditCard,
  Investments: TrendingUp,
};

const initialState = {
  transactions: [
    { id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), type: "income", category: "Salary", description: "Paycheque", amount: 3200 },
    { id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), type: "expense", category: "Rent", description: "Monthly rent", amount: 800 },
    { id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), type: "expense", category: "Groceries", description: "Groceries", amount: 250 },
    { id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), type: "saving", category: "TFSA", description: "TFSA contribution", amount: 500 },
  ],
  budgets: {
    Rent: 900,
    Groceries: 400,
    Bills: 250,
    Subscriptions: 100,
    "Family Transfer": 500,
    Dining: 200,
    Travel: 250,
    Other: 200,
  },
  cards: [
    { id: crypto.randomUUID(), name: "Scotia Visa", balance: 4000, limit: 10500, apr: 20.99 },
    { id: crypto.randomUUID(), name: "CIBC Aventura", balance: 0, limit: 5000, apr: 20.99 },
  ],
};

function money(value) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(Number(value || 0));
}

function monthKey(date) {
  return date.slice(0, 7);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : initialState;
  } catch {
    return initialState;
  }
}

function EmptyState({ text }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{text}</div>;
}

function StatCard({ title, value, icon: Icon, note }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          {note ? <p className="mt-1 text-xs text-slate-500">{note}</p> : null}
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700"><Icon size={20} /></div>
      </div>
    </motion.div>
  );
}

export default function PersonalBudgetApp() {
  const [data, setData] = useState(loadData);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth());
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: "expense",
    category: "Groceries",
    description: "",
    amount: "",
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const monthTransactions = useMemo(() => {
    return data.transactions
      .filter((t) => monthKey(t.date) === selectedMonth)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.transactions, selectedMonth]);

  const totals = useMemo(() => {
    const income = monthTransactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expenses = monthTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const savings = monthTransactions.filter((t) => t.type === "saving").reduce((s, t) => s + Number(t.amount), 0);
    const debt = monthTransactions.filter((t) => t.type === "debt").reduce((s, t) => s + Number(t.amount), 0);
    const investments = monthTransactions.filter((t) => t.type === "investment").reduce((s, t) => s + Number(t.amount), 0);
    const remaining = income - expenses - savings - debt - investments;
    const savingsRate = income > 0 ? ((savings + investments) / income) * 100 : 0;
    return { income, expenses, savings, debt, investments, remaining, savingsRate };
  }, [monthTransactions]);

  const spendingByCategory = useMemo(() => {
    const map = {};
    monthTransactions
      .filter((t) => ["expense", "debt"].includes(t.type))
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + Number(t.amount);
      });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [monthTransactions]);

  const budgetRows = useMemo(() => {
    return Object.entries(data.budgets).map(([category, limit]) => {
      const spent = monthTransactions
        .filter((t) => t.category === category && ["expense", "debt"].includes(t.type))
        .reduce((s, t) => s + Number(t.amount), 0);
      return { category, limit: Number(limit), spent, remaining: Number(limit) - spent, pct: limit > 0 ? Math.min((spent / Number(limit)) * 100, 100) : 0 };
    });
  }, [data.budgets, monthTransactions]);

  function resetForm() {
    setForm({ date: new Date().toISOString().slice(0, 10), type: "expense", category: "Groceries", description: "", amount: "" });
    setEditing(null);
  }

  function saveTransaction(e) {
    e.preventDefault();
    if (!form.date || !form.category || !form.amount) return;
    const payload = { ...form, amount: Number(form.amount), description: form.description.trim() };
    if (editing) {
      setData((prev) => ({ ...prev, transactions: prev.transactions.map((t) => (t.id === editing ? { ...payload, id: editing } : t)) }));
    } else {
      setData((prev) => ({ ...prev, transactions: [{ ...payload, id: crypto.randomUUID() }, ...prev.transactions] }));
    }
    resetForm();
  }

  function editTransaction(t) {
    setEditing(t.id);
    setForm({ date: t.date, type: t.type, category: t.category, description: t.description, amount: t.amount });
  }

  function deleteTransaction(id) {
    setData((prev) => ({ ...prev, transactions: prev.transactions.filter((t) => t.id !== id) }));
  }

  function updateBudget(category, value) {
    setData((prev) => ({ ...prev, budgets: { ...prev.budgets, [category]: Number(value) } }));
  }

  function updateCard(id, field, value) {
    setData((prev) => ({
      ...prev,
      cards: prev.cards.map((c) => (c.id === id ? { ...c, [field]: field === "name" ? value : Number(value) } : c)),
    }));
  }

  function exportCSV() {
    const headers = ["date", "type", "category", "description", "amount"];
    const rows = data.transactions.map((t) => headers.map((h) => `"${String(t[h] ?? "").replaceAll('"', '""')}"`).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `budget-export-${selectedMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const chartColors = ["#0f172a", "#334155", "#475569", "#64748b", "#94a3b8", "#cbd5e1", "#1e293b", "#475569"];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl bg-slate-950 p-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-300">Personal finance dashboard</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">My Budget Tracker</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">Track income, spending, savings, debt, TFSA/RRSP/FHSA, family transfers, and investments in one simple app.</p>
          </div>
          <div className="flex flex-col gap-2 sm:items-end">
            <label className="text-xs text-slate-300">Month</label>
            <input type="month"
  value={selectedMonth}
  onChange={(e) => setSelectedMonth(e.target.value)}
  onInput={(e) => setSelectedMonth(e.target.value)}
  className="rounded-xl border border-slate-700 bg-white px-3 py-2 text-slate-950 outline-none" />
            <button onClick={exportCSV} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-100">
              <Download size={16} /> Export CSV
            </button>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Income" value={money(totals.income)} icon={Wallet} />
          <StatCard title="Expenses" value={money(totals.expenses)} icon={Receipt} />
          <StatCard title="Remaining" value={money(totals.remaining)} icon={PiggyBank} note={totals.remaining >= 0 ? "Positive cash flow" : "Overspent this month"} />
          <StatCard title="Savings Rate" value={`${totals.savingsRate.toFixed(1)}%`} icon={TrendingUp} note="Savings + investments / income" />
        </section>

        <main className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">Add transaction</h2>
                {editing ? <button onClick={resetForm} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900"><X size={15} /> Cancel edit</button> : null}
              </div>
              <form onSubmit={saveTransaction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300" />
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300">
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="saving">Saving</option>
                  <option value="debt">Debt Payment</option>
                  <option value="investment">Investment</option>
                </select>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300">
                  {["Salary", ...defaultCategories].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300" />
                <div className="flex gap-2">
                  <input type="number" step="0.01" min="0" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300" />
                  <button className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-white hover:bg-slate-800">
                    {editing ? <Check size={18} /> : <Plus size={18} />}
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-lg font-bold">Transactions</h2>
              {monthTransactions.length === 0 ? <EmptyState text="No transactions for this month yet." /> : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                      <tr><th className="py-3">Date</th><th>Type</th><th>Category</th><th>Description</th><th className="text-right">Amount</th><th className="text-right">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {monthTransactions.map((t) => {
                        const Icon = categoryIcons[t.category] || Receipt;
                        return (
                          <tr key={t.id} className="hover:bg-slate-50">
                            <td className="py-3">{t.date}</td>
                            <td><span className="rounded-full bg-slate-100 px-2 py-1 text-xs capitalize text-slate-700">{t.type}</span></td>
                            <td><span className="inline-flex items-center gap-2"><Icon size={15} /> {t.category}</span></td>
                            <td className="text-slate-500">{t.description || "—"}</td>
                            <td className="text-right font-semibold">{money(t.amount)}</td>
                            <td className="text-right">
                              <button onClick={() => editTransaction(t)} className="mr-2 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Pencil size={16} /></button>
                              <button onClick={() => deleteTransaction(t.id)} className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-4 text-lg font-bold">Spending by category</h2>
                {spendingByCategory.length === 0 ? <EmptyState text="Add expenses to see the chart." /> : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={spendingByCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                          {spendingByCategory.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => money(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-4 text-lg font-bold">Budget usage</h2>
                {budgetRows.length === 0 ? <EmptyState text="Add budget limits to see this chart." /> : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={budgetRows.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(v) => `$${v}`} />
                        <Tooltip formatter={(v) => money(v)} />
                        <Bar dataKey="spent" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-lg font-bold">Monthly budget limits</h2>
              <div className="space-y-4">
                {budgetRows.map((row) => (
                  <div key={row.category}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium">{row.category}</span>
                      <span className={row.remaining >= 0 ? "text-slate-500" : "text-red-600"}>{money(row.remaining)} left</span>
                    </div>
                    <div className="mb-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={`h-full rounded-full ${row.remaining < 0 ? "bg-red-500" : "bg-slate-900"}`} style={{ width: `${row.pct}%` }} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{money(row.spent)} spent of</span>
                      <input type="number" min="0" value={row.limit} onChange={(e) => updateBudget(row.category, e.target.value)} className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-slate-900 outline-none" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-lg font-bold">Credit cards</h2>
              <div className="space-y-4">
                {data.cards.map((card) => {
                  const pct = card.limit > 0 ? Math.min((card.balance / card.limit) * 100, 100) : 0;
                  return (
                    <div key={card.id} className="rounded-2xl border border-slate-200 p-4">
                      <input value={card.name} onChange={(e) => updateCard(card.id, "name", e.target.value)} className="mb-3 w-full rounded-lg border border-slate-200 px-2 py-1 font-semibold outline-none" />
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <label className="text-slate-500">Balance<input type="number" value={card.balance} onChange={(e) => updateCard(card.id, "balance", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-slate-900 outline-none" /></label>
                        <label className="text-slate-500">Limit<input type="number" value={card.limit} onChange={(e) => updateCard(card.id, "limit", e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-slate-900 outline-none" /></label>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-900" style={{ width: `${pct}%` }} /></div>
                      <p className="mt-2 text-xs text-slate-500">Utilization: {pct.toFixed(1)}%</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-lg font-bold">Savings summary</h2>
              <div className="space-y-3 text-sm">
                {["TFSA", "RRSP", "FHSA", "Investments", "Family Transfer"].map((category) => {
                  const total = monthTransactions.filter((t) => t.category === category).reduce((s, t) => s + Number(t.amount), 0);
                  return <div key={category} className="flex justify-between rounded-xl bg-slate-50 px-3 py-2"><span>{category}</span><strong>{money(total)}</strong></div>;
                })}
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
