import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Download,
  Wallet,
  PiggyBank,
  Receipt,
  Utensils,
  Home,
  Car,
  ShoppingBag,
  Coffee,
  MoreHorizontal,
  Check,
  X,
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

const STORAGE_KEY = "daily-budget-clock-in-v1";

const categories = [
  "Groceries",
  "Coffee",
  "Dining",
  "Rent",
  "Transportation",
  "Shopping",
  "Bills",
  "Subscriptions",
  "Family",
  "Entertainment",
  "Other",
];

const categoryIcons = {
  Groceries: Utensils,
  Coffee: Coffee,
  Dining: Receipt,
  Rent: Home,
  Transportation: Car,
  Shopping: ShoppingBag,
  Bills: Receipt,
  Subscriptions: Receipt,
  Family: Wallet,
  Entertainment: Receipt,
  Other: MoreHorizontal,
};

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function currentTime() {
  return new Date().toTimeString().slice(0, 5);
}

function monthKey(date) {
  return date.slice(0, 7);
}

function money(value) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
  }).format(Number(value || 0));
}

const initialData = {
  expenses: [],
  settings: {
    dailyLimit: 100,
    monthlyLimit: 2000,
  },
};

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialData;
  } catch {
    return initialData;
  }
}

function StatCard({ title, value, note, icon: Icon }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
          {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [selectedDate, setSelectedDate] = useState(todayDate());
  const [selectedMonth, setSelectedMonth] = useState(todayDate().slice(0, 7));
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    category: "Groceries",
    amount: "",
    notes: "",
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const expenses = data.expenses || [];

  const todayExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.date === selectedDate)
      .sort((a, b) => b.time.localeCompare(a.time));
  }, [expenses, selectedDate]);

  const monthExpenses = useMemo(() => {
    return expenses.filter((e) => monthKey(e.date) === selectedMonth);
  }, [expenses, selectedMonth]);

  const todayTotal = todayExpenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );

  const monthlyTotal = monthExpenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );

  const remainingDaily = data.settings.dailyLimit - todayTotal;
  const remainingMonthly = data.settings.monthlyLimit - monthlyTotal;

  const categoryData = useMemo(() => {
    const map = {};
    monthExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [monthExpenses]);

  function resetForm() {
    setForm({
      category: "Groceries",
      amount: "",
      notes: "",
    });
    setEditingId(null);
  }

  function saveExpense(e) {
    e.preventDefault();

    if (!form.category || !form.amount) return;

    const expense = {
      id: editingId || crypto.randomUUID(),
      category: form.category,
      amount: Number(form.amount),
      notes: form.notes.trim(),
      date: todayDate(),
      time: currentTime(),
      createdAt: new Date().toISOString(),
    };

    setData((prev) => {
      if (editingId) {
        return {
          ...prev,
          expenses: prev.expenses.map((x) =>
            x.id === editingId ? expense : x
          ),
        };
      }

      return {
        ...prev,
        expenses: [expense, ...prev.expenses],
      };
    });

    resetForm();
  }

  function editExpense(expense) {
    setEditingId(expense.id);
    setForm({
      category: expense.category,
      amount: expense.amount,
      notes: expense.notes || "",
    });
  }

  function deleteExpense(id) {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  }

  function updateSetting(field, value) {
    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: Number(value),
      },
    }));
  }

  function exportCSV() {
    const headers = ["date", "time", "category", "amount", "notes"];
    const rows = expenses.map((e) =>
      headers
        .map((h) => `"${String(e[h] ?? "").replaceAll('"', '""')}"`)
        .join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "daily-budget-export.csv";
    a.click();

    URL.revokeObjectURL(url);
  }

  const chartColors = [
    "#020617",
    "#1e293b",
    "#334155",
    "#475569",
    "#64748b",
    "#94a3b8",
  ];

  const topCategory =
    categoryData.length > 0
      ? [...categoryData].sort((a, b) => b.value - a.value)[0]
      : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-5">
        <header className="mb-5 rounded-3xl bg-slate-950 p-5 text-white">
          <p className="text-sm text-slate-300">Personal expense tracker</p>
          <h1 className="mt-1 text-3xl font-bold">Daily Budget Clock-In</h1>
          <p className="mt-2 text-sm text-slate-300">
            Quickly log expenses as you spend money and track daily spending in
            real time.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-700 bg-white px-3 py-2 text-slate-950 outline-none"
            />

            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-xl border border-slate-700 bg-white px-3 py-2 text-slate-950 outline-none"
            />

            <button
              onClick={exportCSV}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-950"
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </header>

        <section className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Today Spent"
            value={money(todayTotal)}
            icon={Wallet}
            note="Selected day total"
          />
          <StatCard
            title="This Month"
            value={money(monthlyTotal)}
            icon={Receipt}
            note="Selected month total"
          />
          <StatCard
            title="Daily Limit Left"
            value={money(remainingDaily)}
            icon={PiggyBank}
            note={`Daily limit: ${money(data.settings.dailyLimit)}`}
          />
          <StatCard
            title="Top Category"
            value={topCategory ? topCategory.name : "None"}
            icon={Utensils}
            note={topCategory ? money(topCategory.value) : "No spending yet"}
          />
        </section>

        <main className="grid gap-5 lg:grid-cols-3">
          <section className="space-y-5 lg:col-span-2">
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">
                  {editingId ? "Edit expense" : "Quick add expense"}
                </h2>
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="inline-flex items-center gap-1 text-sm text-slate-500"
                  >
                    <X size={15} />
                    Cancel
                  </button>
                )}
              </div>

              <form
                onSubmit={saveExpense}
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
              >
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="rounded-xl border border-slate-200 px-3 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <input
                  value={form.notes}
                  onChange={(e) =>
                    setForm({ ...form, notes: e.target.value })
                  }
                  placeholder="Notes optional"
                  className="rounded-xl border border-slate-200 px-3 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({ ...form, amount: e.target.value })
                  }
                  placeholder="Amount"
                  className="rounded-xl border border-slate-200 px-3 py-3 outline-none focus:ring-2 focus:ring-slate-300"
                />

                <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 font-semibold text-white">
                  {editingId ? <Check size={18} /> : <Plus size={18} />}
                  {editingId ? "Update" : "Add"}
                </button>
              </form>

              <p className="mt-3 text-xs text-slate-500">
                Date and time are saved automatically.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-lg font-bold">Today’s Expenses</h2>

              {todayExpenses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  No expenses for this day yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {todayExpenses.map((expense) => {
                    const Icon = categoryIcons[expense.category] || Receipt;

                    return (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl bg-slate-100 p-3">
                            <Icon size={18} />
                          </div>
                          <div>
                            <p className="font-semibold">
                              {expense.category}
                            </p>
                            <p className="text-sm text-slate-500">
                              {expense.time}{" "}
                              {expense.notes ? `• ${expense.notes}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-bold">{money(expense.amount)}</p>
                          <div className="mt-1 flex justify-end gap-2">
                            <button
                              onClick={() => editExpense(expense)}
                              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              onClick={() => deleteExpense(expense.id)}
                              className="rounded-lg p-1 text-slate-500 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-4 text-lg font-bold">
                  Spending by Category
                </h2>

                {categoryData.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                    Add expenses to see the chart.
                  </div>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={95}
                          paddingAngle={3}
                        >
                          {categoryData.map((_, i) => (
                            <Cell
                              key={i}
                              fill={chartColors[i % chartColors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => money(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-4 text-lg font-bold">Monthly Category Bar</h2>

                {categoryData.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                    No monthly data yet.
                  </div>
                ) : (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(v) => `$${v}`} />
                        <Tooltip formatter={(v) => money(v)} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-5">
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-lg font-bold">Budget Limits</h2>

              <div className="space-y-4">
                <label className="block text-sm font-medium">
                  Daily Limit
                  <input
                    type="number"
                    value={data.settings.dailyLimit}
                    onChange={(e) =>
                      updateSetting("dailyLimit", e.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none"
                  />
                </label>

                <label className="block text-sm font-medium">
                  Monthly Limit
                  <input
                    type="number"
                    value={data.settings.monthlyLimit}
                    onChange={(e) =>
                      updateSetting("monthlyLimit", e.target.value)
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none"
                  />
                </label>
              </div>

              <div className="mt-5 space-y-3 text-sm">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-slate-500">Daily Status</p>
                  <p
                    className={
                      remainingDaily < 0
                        ? "font-bold text-red-600"
                        : "font-bold text-slate-950"
                    }
                  >
                    {remainingDaily < 0
                      ? `Over by ${money(Math.abs(remainingDaily))}`
                      : `${money(remainingDaily)} left today`}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-slate-500">Monthly Status</p>
                  <p
                    className={
                      remainingMonthly < 0
                        ? "font-bold text-red-600"
                        : "font-bold text-slate-950"
                    }
                  >
                    {remainingMonthly < 0
                      ? `Over by ${money(Math.abs(remainingMonthly))}`
                      : `${money(remainingMonthly)} left this month`}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-4 text-lg font-bold">Monthly Summary</h2>

              <div className="space-y-3">
                {categoryData.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No spending for this month yet.
                  </p>
                ) : (
                  categoryData.map((item) => (
                    <div
                      key={item.name}
                      className="flex justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span>{item.name}</span>
                      <strong>{money(item.value)}</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}