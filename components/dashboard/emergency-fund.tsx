import { formatCurrency } from "@/lib/calculations";

interface EmergencyFundProps {
  emergencyFund3Month: number;
  emergencyFund6Month: number;
  totalJointExpenses: number;
}

export default function EmergencyFundWidget({
  emergencyFund3Month,
  emergencyFund6Month,
  totalJointExpenses,
}: EmergencyFundProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <div className="mb-4">
        <h2 className="font-semibold text-white">Emergency Fund Targets</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Based on {formatCurrency(totalJointExpenses)}/mo in joint expenses
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">3-month target</p>
          <p className="text-xl font-bold text-yellow-400">{formatCurrency(emergencyFund3Month)}</p>
          <p className="text-xs text-slate-500 mt-1">Minimum recommended</p>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">6-month target</p>
          <p className="text-xl font-bold text-emerald-400">{formatCurrency(emergencyFund6Month)}</p>
          <p className="text-xs text-slate-500 mt-1">Fully funded goal</p>
        </div>
      </div>

      {totalJointExpenses === 0 && (
        <p className="text-xs text-slate-500 mt-3">
          Add joint expenses to calculate your emergency fund targets.
        </p>
      )}
    </div>
  );
}
