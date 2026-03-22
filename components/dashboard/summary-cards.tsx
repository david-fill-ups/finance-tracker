import { formatCurrency } from "@/lib/calculations";

interface SummaryCardsProps {
  totalMonthlyIncome: number;
  totalJointExpenses: number;
  totalPersonalExpenses: number;
  netCashflow: number;
}

function Card({
  label,
  value,
  sub,
  color = "white",
}: {
  label: string;
  value: string;
  sub?: string;
  color?: "white" | "emerald" | "blue" | "purple" | "red";
}) {
  const valueClass =
    color === "emerald" ? "text-emerald-400"
    : color === "blue"    ? "text-blue-400"
    : color === "purple"  ? "text-purple-400"
    : color === "red"     ? "text-red-400"
    : "text-white";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

export default function SummaryCards({
  totalMonthlyIncome,
  totalJointExpenses,
  totalPersonalExpenses,
  netCashflow,
}: SummaryCardsProps) {
  const totalExpenses = totalJointExpenses + totalPersonalExpenses;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        label="Monthly Income"
        value={formatCurrency(totalMonthlyIncome)}
        sub="All sources combined"
        color="emerald"
      />
      <Card
        label="Joint Expenses"
        value={formatCurrency(totalJointExpenses)}
        sub="Shared by household"
        color="blue"
      />
      <Card
        label="Personal Expenses"
        value={formatCurrency(totalPersonalExpenses)}
        sub="Individual obligations"
        color="purple"
      />
      <Card
        label="Net Cashflow"
        value={formatCurrency(netCashflow)}
        sub={
          netCashflow >= 0
            ? `${formatCurrency(totalExpenses)} total expenses`
            : "Expenses exceed income"
        }
        color={netCashflow >= 0 ? "emerald" : "red"}
      />
    </div>
  );
}
