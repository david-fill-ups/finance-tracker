"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Modal from "@/components/ui/modal";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

interface Category {
  id: string;
  name: string;
  _count: { expenses: number };
}

export default function CategoriesClient({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  function openNew() { setEditing(null); setName(""); setIsOpen(true); }
  function openEdit(c: Category) { setEditing(c); setName(c.name); setIsOpen(true); }
  function close() { setIsOpen(false); setEditing(null); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);

    const url = editing ? `/api/categories/${editing.id}` : "/api/categories";
    const method = editing ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (res.ok) {
        toast.success(editing ? "Category updated" : "Category added");
        close(); router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Something went wrong");
      }
    } catch { toast.error("Network error"); }
    finally { setSaving(false); }
  }

  async function handleDelete(c: Category) {
    if (c._count.expenses > 0) {
      if (!confirm(`"${c.name}" is used by ${c._count.expenses} expense(s). Delete anyway?`)) return;
    } else {
      if (!confirm(`Delete "${c.name}"?`)) return;
    }
    try {
      const res = await fetch(`/api/categories/${c.id}`, { method: "DELETE" });
      if (res.ok) { toast.success("Category deleted"); router.refresh(); }
      else toast.error("Failed to delete");
    } catch { toast.error("Network error"); }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openNew}>+ Add Category</Button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center">
          <p className="text-slate-400 text-sm">No categories yet.</p>
          <p className="text-slate-500 text-xs mt-1">
            Categories help organize expenses (e.g. Housing, Food, Utilities).
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-slate-400 font-medium px-4 py-2.5">Name</th>
                <th className="text-right text-slate-400 font-medium px-4 py-2.5">Expenses</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {categories.map((c, i) => (
                <tr key={c.id} className={i < categories.length - 1 ? "border-b border-slate-800" : ""}>
                  <td className="px-4 py-3 text-white font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-right text-slate-400">{c._count.expenses}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(c)}
                        className="text-red-400 hover:text-red-300">Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={isOpen} onClose={close} title={editing ? "Edit Category" : "Add Category"}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input id="cat-name" label="Name" value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Housing, Food, Utilities" required />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Saving…" : editing ? "Save changes" : "Add category"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
