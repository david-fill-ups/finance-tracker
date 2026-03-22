import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import ExpensesClient from "@/components/expenses/expenses-client";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await db.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) redirect("/setup");

  const [expenses, people, categories] = await Promise.all([
    db.expense.findMany({
      where: { profileId: profile.id },
      include: {
        person: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
    db.person.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: "asc" },
    }),
    db.category.findMany({
      where: { profileId: profile.id },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Expenses</h1>
        <p className="text-slate-400 text-sm mt-1">Track joint and personal household expenses.</p>
      </div>
      <ExpensesClient
        expenses={JSON.parse(JSON.stringify(expenses))}
        people={JSON.parse(JSON.stringify(people))}
        categories={JSON.parse(JSON.stringify(categories))}
      />
    </div>
  );
}
