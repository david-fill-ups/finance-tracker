import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import IncomeClient from "@/components/income/income-client";

export const dynamic = "force-dynamic";

export default async function IncomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await db.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) redirect("/setup");

  const [people, income] = await Promise.all([
    db.person.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: "asc" },
    }),
    db.incomeSource.findMany({
      where: { person: { profileId: profile.id } },
      include: { person: { select: { id: true, name: true } } },
      orderBy: [{ person: { name: "asc" } }, { createdAt: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Income</h1>
        <p className="text-slate-400 text-sm mt-1">Track income sources for each household member.</p>
      </div>
      <IncomeClient
        income={JSON.parse(JSON.stringify(income))}
        people={JSON.parse(JSON.stringify(people))}
      />
    </div>
  );
}
