import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { calculateDashboard, type Frequency } from "@/lib/calculations";
import SummaryCards from "@/components/dashboard/summary-cards";
import PersonBreakdownTable from "@/components/dashboard/person-breakdown";
import EmergencyFundWidget from "@/components/dashboard/emergency-fund";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await db.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) redirect("/setup");

  const [people, expenses] = await Promise.all([
    db.person.findMany({
      where: { profileId: profile.id },
      include: { incomes: true },
      orderBy: { createdAt: "asc" },
    }),
    db.expense.findMany({
      where: { profileId: profile.id },
      orderBy: { name: "asc" },
    }),
  ]);

  const peopleInput = people.map((p) => ({
    id: p.id,
    name: p.name,
    incomes: p.incomes.map((i) => ({
      amount: Number(i.amount),
      frequency: i.frequency as Frequency,
    })),
  }));

  const expensesInput = expenses.map((e) => ({
    amount: Number(e.amount),
    frequency: e.frequency as Frequency,
    type: e.type as "JOINT" | "PERSONAL",
    personId: e.personId,
  }));

  const dashboard = calculateDashboard(peopleInput, expensesInput);
  const hasPeople = people.length > 0;
  const hasData = hasPeople || expenses.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
        <p className="text-slate-400 text-sm mt-1">Monthly cashflow overview</p>
      </div>

      {!hasData ? (
        /* ── Empty state ── */
        <div className="bg-slate-900 border border-dashed border-slate-700 rounded-xl p-8">
          <h2 className="font-semibold text-white mb-2">Get started</h2>
          <p className="text-slate-400 text-sm mb-4">
            Add household members and their income sources to see your cashflow breakdown.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/people"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Add People
            </Link>
            <Link href="/income"
              className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Add Income
            </Link>
            <Link href="/expenses"
              className="bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Add Expenses
            </Link>
          </div>
        </div>
      ) : (
        /* ── Dashboard ── */
        <>
          <SummaryCards
            totalMonthlyIncome={dashboard.totalMonthlyIncome}
            totalJointExpenses={dashboard.totalJointExpenses}
            totalPersonalExpenses={dashboard.totalPersonalExpenses}
            netCashflow={dashboard.netCashflow}
          />

          {hasPeople && (
            <PersonBreakdownTable breakdowns={dashboard.personBreakdowns} />
          )}

          <EmergencyFundWidget
            emergencyFund3Month={dashboard.emergencyFund3Month}
            emergencyFund6Month={dashboard.emergencyFund6Month}
            totalJointExpenses={dashboard.totalJointExpenses}
          />
        </>
      )}
    </div>
  );
}
