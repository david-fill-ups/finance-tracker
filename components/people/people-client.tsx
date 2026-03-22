"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Modal from "@/components/ui/modal";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { toMonthlyAmount, formatCurrency, type Frequency } from "@/lib/calculations";

interface Income {
  id: string;
  amount: number;
  frequency: string;
}

interface Person {
  id: string;
  name: string;
  role: string | null;
  incomes: Income[];
}

const ROLE_LABELS: Record<string, string> = {
  self: "Self",
  spouse: "Spouse",
  dependent: "Dependent",
};

export default function PeopleClient({ people }: { people: Person[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [role, setRole] = useState("");

  function openNew() {
    setEditing(null);
    setName("");
    setRole("");
    setIsOpen(true);
  }

  function openEdit(person: Person) {
    setEditing(person);
    setName(person.name);
    setRole(person.role ?? "");
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    setEditing(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const body = { name: name.trim(), role: role || null };
    const url = editing ? `/api/people/${editing.id}` : "/api/people";
    const method = editing ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editing ? "Person updated" : "Person added");
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

  async function handleDelete(person: Person) {
    if (!confirm(`Delete ${person.name}? This will also delete all their income sources.`)) return;

    try {
      const res = await fetch(`/api/people/${person.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Person deleted");
        router.refresh();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Network error");
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openNew}>+ Add Person</Button>
      </div>

      {people.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
          <p className="text-slate-400 text-sm">No people yet.</p>
          <p className="text-slate-500 text-xs mt-1">Add household members to get started.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person) => {
            const monthlyIncome = person.incomes.reduce(
              (sum, i) => sum + toMonthlyAmount(i.amount as number, i.frequency as Frequency),
              0
            );
            return (
              <div
                key={person.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{person.name}</h3>
                    {person.role && (
                      <span className="text-xs text-slate-400 mt-0.5 block">
                        {ROLE_LABELS[person.role] ?? person.role}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(person)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(person)}
                      className="text-red-400 hover:text-red-300">
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3">
                  <p className="text-xs text-slate-500">Monthly income</p>
                  <p className="text-lg font-semibold text-emerald-400">
                    {formatCurrency(monthlyIncome)}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {person.incomes.length} income source{person.incomes.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={isOpen}
        onClose={close}
        title={editing ? `Edit ${editing.name}` : "Add Person"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            id="person-name"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alice"
            required
          />

          <Select
            id="person-role"
            label="Role (optional)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="">No role</option>
            <option value="self">Self</option>
            <option value="spouse">Spouse</option>
            <option value="dependent">Dependent</option>
          </Select>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Saving…" : editing ? "Save changes" : "Add person"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
