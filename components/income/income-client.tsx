"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Modal from "@/components/ui/modal";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { toMonthlyAmount, frequencyLabel, formatCurrency, type Frequency } from "@/lib/calculations";

interface Person {
  id: string;
  name: string;
}

interface IncomeSource {
  id: string;
  personId: string;
  name: string;
  amount: number;
  frequency: string;
  notes: string | null;
  person: { id: string; name: string };
}

export default function IncomeClient({
  income,
  people,
}: {
  income: IncomeSource[];
  people: Person[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeSource | null>(null);
  const [saving, setSaving] = useState(false);

  const [personId, setPersonId] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("monthly");
  const [notes, setNotes] = useState("");

  function openNew() {
    setEditing(null);
    setPersonId(people[0]?.id ?? "");
    setName("");
    setAmount("");
    setFrequency("monthly");
    setNotes("");
    setIsOpen(true);
  }

  function openEdit(item: IncomeSource) {
    setEditing(item);
    setPersonId(item.personId);
    setName(item.name);
    setAmount(String(item.amount));
    setFrequency(item.frequency as Frequency);
    setNotes(item.notes ?? "");
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    setEditing(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Amount must be a positive number");
      return;
    }
    setSaving(true);

    const body = editing
      ? { name, amount: amountNum, frequency, notes: notes || null }
      : { personId, name, amount: amountNum, frequency, notes: notes || null };

    const url = editing ? `/api/income/${editing.id}` : "/api/income";
    const method = editing ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editing ? "Income updated" : "Income added");
        close();
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Something went wrong");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: IncomeSource) {
    if (!confirm(`Delete "${item.name}"?`)) return;
    try {
      const res = await fetch(`/api/income/${item.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Income deleted");
        router.refresh();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Network error");
    }
  }

  // Group income by person
  const byPerson = people.map((p) => ({
    person: p,
    items: income.filter((i) => i.personId === p.id),
  }));

  return (
    <>
      {people.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
          <p className="text-slate-400 text-sm">Add people first before tracking income.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <Button onClick={openNew}>+ Add Income</Button>
          </div>

          <div className="space-y-6">
            {byPerson.map(({ person, items }) => (
              <div key={person.id}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-white">{person.name}</h2>
                  <span className="text-sm text-emerald-400 font-medium">
                    {formatCurrency(
                      items.reduce(
                        (s, i) => s + toMonthlyAmount(i.amount, i.frequency as Frequency),
                        0
                      )
                    )}
                    /mo
                  </span>
                </div>

                {items.length === 0 ? (
                  <div className="bg-slate-900 border border-dashed border-slate-700 rounded-xl p-5 text-center">
                    <p className="text-slate-500 text-sm">No income sources for {person.name}.</p>
                  </div>
                ) : (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="text-left text-slate-400 font-medium px-4 py-2.5">Source</th>
                          <th className="text-right text-slate-400 font-medium px-4 py-2.5">Amount</th>
                          <th className="text-right text-slate-400 font-medium px-4 py-2.5">Frequency</th>
                          <th className="text-right text-slate-400 font-medium px-4 py-2.5">/mo</th>
                          <th className="px-4 py-2.5" />
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, i) => (
                          <tr key={item.id}
                            className={i < items.length - 1 ? "border-b border-slate-800" : ""}>
                            <td className="px-4 py-3 text-white">{item.name}</td>
                            <td className="px-4 py-3 text-right text-slate-300">
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-400">
                              {frequencyLabel(item.frequency as Frequency)}
                            </td>
                            <td className="px-4 py-3 text-right text-emerald-400 font-medium">
                              {formatCurrency(toMonthlyAmount(item.amount, item.frequency as Frequency))}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>Edit</Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}
                                  className="text-red-400 hover:text-red-300">Delete</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <Modal
        open={isOpen}
        onClose={close}
        title={editing ? "Edit Income Source" : "Add Income Source"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {!editing && (
            <Select
              id="income-person"
              label="Person"
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              required
            >
              {people.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          )}

          <Input
            id="income-name"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Salary, Bonus, SRECs"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="income-amount"
              label="Amount ($)"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
            <Select
              id="income-frequency"
              label="Frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
            >
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

          <Input
            id="income-notes"
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Add income"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
