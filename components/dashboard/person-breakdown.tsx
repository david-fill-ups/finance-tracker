import { formatCurrency } from "@/lib/calculations";
import type { PersonBreakdown } from "@/lib/calculations";

export default function PersonBreakdownTable({
  breakdowns,
}: {
  breakdowns: PersonBreakdown[];
}) {
  if (breakdowns.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
        <p className="text-slate-400 text-sm">No people added yet.</p>
        <p className="text-slate-500 text-xs mt-1">
          Add household members under <strong className="text-slate-400">People</strong> to see the breakdown.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-800">
        <h2 className="font-semibold text-white">Per-Person Breakdown</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Joint expenses allocated by income proportion
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left text-slate-400 font-medium px-5 py-2.5">Person</th>
              <th className="text-right text-slate-400 font-medium px-4 py-2.5">Income</th>
              <th className="text-right text-slate-400 font-medium px-4 py-2.5">Personal exp.</th>
              <th className="text-right text-slate-400 font-medium px-4 py-2.5">Joint share</th>
              <th className="text-right text-slate-400 font-medium px-5 py-2.5">Net</th>
            </tr>
          </thead>
          <tbody>
            {breakdowns.map((b, i) => (
              <tr key={b.personId}
                className={i < breakdowns.length - 1 ? "border-b border-slate-800" : ""}>
                <td className="px-5 py-3 font-medium text-white">{b.personName}</td>
                <td className="px-4 py-3 text-right text-emerald-400 font-medium">
                  {formatCurrency(b.monthlyIncome)}
                </td>
                <td className="px-4 py-3 text-right text-purple-400">
                  {formatCurrency(b.personalExpenses)}
                </td>
                <td className="px-4 py-3 text-right text-blue-400">
                  {formatCurrency(b.jointShare)}
                </td>
                <td className="px-5 py-3 text-right font-bold">
                  <span className={b.net >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {b.net >= 0 ? "+" : ""}
                    {formatCurrency(b.net)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          {breakdowns.length > 1 && (
            <tfoot>
              <tr className="border-t border-slate-700 bg-slate-800/40">
                <td className="px-5 py-3 font-semibold text-slate-300 text-xs uppercase tracking-wide">Total</td>
                <td className="px-4 py-3 text-right text-emerald-400 font-semibold">
                  {formatCurrency(breakdowns.reduce((s, b) => s + b.monthlyIncome, 0))}
                </td>
                <td className="px-4 py-3 text-right text-purple-400 font-semibold">
                  {formatCurrency(breakdowns.reduce((s, b) => s + b.personalExpenses, 0))}
                </td>
                <td className="px-4 py-3 text-right text-blue-400 font-semibold">
                  {formatCurrency(breakdowns.reduce((s, b) => s + b.jointShare, 0))}
                </td>
                <td className="px-5 py-3 text-right font-bold">
                  {(() => {
                    const net = breakdowns.reduce((s, b) => s + b.net, 0);
                    return (
                      <span className={net >= 0 ? "text-emerald-400" : "text-red-400"}>
                        {net >= 0 ? "+" : ""}{formatCurrency(net)}
                      </span>
                    );
                  })()}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
