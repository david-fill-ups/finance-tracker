// ── Types ─────────────────────────────────────────────────────────────────────

export type Frequency = "monthly" | "yearly" | "weekly" | "one_time";

export interface IncomeInput {
  amount: number;
  frequency: Frequency;
}

export interface PersonInput {
  id: string;
  name: string;
  incomes: IncomeInput[];
}

export interface ExpenseInput {
  amount: number;
  frequency: Frequency;
  type: "JOINT" | "PERSONAL";
  personId: string | null;
}

export interface PersonBreakdown {
  personId: string;
  personName: string;
  monthlyIncome: number;
  personalExpenses: number;
  jointShare: number;
  net: number;
}

export interface DashboardData {
  totalMonthlyIncome: number;
  totalJointExpenses: number;
  totalPersonalExpenses: number;
  netCashflow: number;
  personBreakdowns: PersonBreakdown[];
  emergencyFund3Month: number;
  emergencyFund6Month: number;
}

// ── Frequency normalization ───────────────────────────────────────────────────

/**
 * Converts any amount + frequency to its monthly equivalent.
 *
 * - monthly:  1:1
 * - yearly:   ÷ 12
 * - weekly:   × 52 ÷ 12  (exact weeks-per-year conversion)
 * - one_time: ÷ 12       (amortized over 12 months for budgeting purposes)
 */
export function toMonthlyAmount(amount: number, frequency: Frequency): number {
  switch (frequency) {
    case "monthly":  return amount;
    case "yearly":   return amount / 12;
    case "weekly":   return (amount * 52) / 12;
    case "one_time": return amount / 12;
  }
}

/**
 * Returns a human-readable frequency label.
 */
export function frequencyLabel(frequency: Frequency): string {
  switch (frequency) {
    case "monthly":  return "Monthly";
    case "yearly":   return "Yearly";
    case "weekly":   return "Weekly";
    case "one_time": return "One Time";
  }
}

// ── Dashboard calculation ─────────────────────────────────────────────────────

/**
 * Computes the full dashboard breakdown from raw income and expense data.
 *
 * Joint expense allocation:
 *   - Each person's share = (personIncome / totalIncome) × totalJointExpenses
 *   - Edge case (totalIncome = 0): split equally among all people
 */
export function calculateDashboard(
  people: PersonInput[],
  expenses: ExpenseInput[]
): DashboardData {
  // 1. Monthly income per person
  const incomeMap = new Map<string, number>(
    people.map((p) => [
      p.id,
      p.incomes.reduce((sum, i) => sum + toMonthlyAmount(i.amount, i.frequency), 0),
    ])
  );
  const totalMonthlyIncome = [...incomeMap.values()].reduce((s, v) => s + v, 0);

  // 2. Joint expense total
  const jointExpenses = expenses.filter((e) => e.type === "JOINT");
  const totalJointExpenses = jointExpenses.reduce(
    (s, e) => s + toMonthlyAmount(e.amount, e.frequency),
    0
  );

  // 3. Personal expenses per person
  const personalMap = new Map<string, number>(
    people.map((p) => [
      p.id,
      expenses
        .filter((e) => e.type === "PERSONAL" && e.personId === p.id)
        .reduce((s, e) => s + toMonthlyAmount(e.amount, e.frequency), 0),
    ])
  );
  const totalPersonalExpenses = [...personalMap.values()].reduce((s, v) => s + v, 0);

  // 4. Per-person breakdown
  const personBreakdowns: PersonBreakdown[] = people.map((p) => {
    const monthlyIncome = incomeMap.get(p.id) ?? 0;
    const personalExpenses = personalMap.get(p.id) ?? 0;

    // Proportional joint share; equal split if total income is zero
    const jointShare =
      totalMonthlyIncome > 0
        ? (monthlyIncome / totalMonthlyIncome) * totalJointExpenses
        : people.length > 0
          ? totalJointExpenses / people.length
          : 0;

    return {
      personId: p.id,
      personName: p.name,
      monthlyIncome,
      personalExpenses,
      jointShare,
      net: monthlyIncome - personalExpenses - jointShare,
    };
  });

  return {
    totalMonthlyIncome,
    totalJointExpenses,
    totalPersonalExpenses,
    netCashflow: totalMonthlyIncome - totalJointExpenses - totalPersonalExpenses,
    personBreakdowns,
    // Emergency fund targets based on joint expenses (fixed household obligations)
    emergencyFund3Month: totalJointExpenses * 3,
    emergencyFund6Month: totalJointExpenses * 6,
  };
}

// ── Formatting helpers ────────────────────────────────────────────────────────

/**
 * Formats a number as USD currency.
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
