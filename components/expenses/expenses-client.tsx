"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Modal from "@/components/ui/modal";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { toMonthlyAmount, frequencyLabel, formatCurrency, type Frequency } from "@/lib/calculations";

interface Person  { id: string; name: string }
interface Category { id: string; name: string }
interface Expense {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  type: "JOINT" | "PERSONAL";
  personId: string | null;
  categoryId: string | null;
  notes: string | null;
  person: Person | null;
  category: Category | null;
}

type Filter = "all" | "JOINT" | "PERSONAL";

export default function ExpensesClient({
  expenses,
  people,
  categories,
}: {
  expenses: Expense[];
  people: Person[];
  categories: Category[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [catFilter, setCatFilter] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [type, setType] = useState<"JOINT" | "PERSONAL">("JOINT");
  const [personId, setPersonId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");

  function openNew() {
    setEditing(null);
    setName(""); setAmount(""); setFrequency("monthly");
    setType("JOINT"); setPersonId(people[0]?.id ?? "");
    setCategoryId(""); setNotes("");
    setIsOpen(true);
  }

  function openEdit(exp: Expense) {
    setEditing(exp);
    setName(exp.name); setAmount(String(exp.amount));
    setFrequency(exp.frequency as Frequency); setType(exp.type);
    setPersonId(exp.personId ?? people[0]?.id ?? "");
    setCategoryId(exp.categoryId ?? ""); setNotes(exp.notes ?? "");
    setIsOpen(true);
  }

  function close() { setIsOpen(false); setEditing(null); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) { toast.error("Amount must be positive"); return; }
    setSaving(true);

    const body = {
      name, amount: amountNum, frequency, type,
      personId: type === "PERSONAL" ? personId || null : null,
      categoryId: categoryId || null,
      notes: notes || null,
    };
    const url = editing ? `/api/expenses/${editing.id}` : "/api/expenses";
    const method = editing ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(editing ? "Expense updated" : "Expense added");
        close(); router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Something went wrong");
      }
    } catch { toast.error("Network error"); }
    finally { setSaving(false); }
  }

  async function handleDelete(exp: Expense) {
    if (!confirm(`Delete "${exp.name}"?`)) return;
    try {
      const res = await fetch(`/api/expenses/${exp.id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Expense deleted"); router.refresh(); }
      else toast.error("Failed to delete");
    } catch { toast.error("Network error"); }
  }

  const filtered = expenses.filter((e) => {
    if (filter !== "all" && e.type !== filter) return false;
    if (catFilter && e.categoryId !== catFilter) return false;
    return true;
  });

  const totalMonthly = filtered.reduce(
    (s, e) => s + toMonthlyAmount(e.amount, e.frequency as Frequency), 0
  );

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
          {(["all", "JOINT", "PERSONAL"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                filter === f ? "bg-slate-700 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {f === "all" ? "All" : f === "JOINT" ? "Joint" : "Personal"}
            </button>
          ))}
        </div>

        {categories.length > 0 && (
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-slate-400">
            {filtered.length} expense{filtered.length !== 1 ? "s" : ""} ·{" "}
            <span className="text-white font-medium">{formatCurrency(totalMonthly)}/mo</span>
          </span>
          <Button onClick={openNew}>+ Add Expense</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
          <p className="text-slate-400 text-sm">No expenses found.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-slate-400 font-medium px-4 py-2.5">Expense</th>
                <th className="text-left text-slate-400 font-medium px-4 py-2.5 hidden md:table-cell">Category</th>
                <th className="text-left text-slate-400 font-medium px-4 py-2.5">Type</th>
                <th className="text-right text-slate-400 font-medium px-4 py-2.5">Amount</th>
                <th className="text-right text-slate-400 font-medium px-4 py-2.5 hidden sm:table-cell">Freq</th>
                <th className="text-right text-slate-400 font-medium px-4 py-2.5">/mo</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp, i) => (
                <tr key={exp.id} className={i < filtered.length - 1 ? "border-b border-slate-800" : ""}>
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{exp.name}</div>
                    {exp.person && (
                      <div className="text-xs text-slate-500">{exp.person.name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                    {exp.category?.name ?? <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      exp.type === "JOINT"
                        ? "bg-blue-500/10 text-blue-400"
                        : "bg-purple-500/10 text-purple-400"
                    }`}>
                      {exp.type === "JOINT" ? "Joint" : "Personal"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300">
                    {formatCurrency(exp.amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400 hidden sm:table-cell">
                    {frequencyLabel(exp.frequency as Frequency)}
                  </td>
                  <td className="px-4 py-3 text-right text-white font-medium">
                    {formatCurrency(toMonthlyAmount(exp.amount, exp.frequency as Frequency))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(exp)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(exp)}
                        className="text-red-400 hover:text-red-300">Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={isOpen}
        onClose={close}
        title={editing ? "Edit Expense" : "Add Expense"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input id="exp-name" label="Name" value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mortgage, Netflix" required />

          <div className="grid grid-cols-2 gap-3">
            <Input id="exp-amount" label="Amount ($)" type="number" min="0" step="0.01"
              value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00" required />
            <Select id="exp-frequency" label="Frequency" value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="weekly">Weekly</option>
              <option value="one_time">One Time</option>
            </Select>
          </div>

          {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && frequency !== "monthly" && (
            <p className="text-xs text-slate-400">
              ≈ {formatCurrency(toMonthlyAmount(parseFloat(amount), frequency))}/month
            </p>
          )}

          <Select id="exp-type" label="Type" value={type}
            onChange={(e) => setType(e.target.value as "JOINT" | "PERSONAL")}>
            <option value="JOINT">Joint (shared by household)</option>
            <option value="PERSONAL">Personal (one person)</option>
          </Select>

          {type === "PERSONAL" && (
            <Select id="exp-person" label="Person" value={personId}
              onChange={(e) => setPersonId(e.target.value)} required>
              <option value="">Select person…</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          )}

          {categories.length > 0 && (
            <Select id="exp-category" label="Category (optional)" value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          )}

          <Input id="exp-notes" label="Notes (optional)" value={notes}
            onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Add expense"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
