import { z } from "zod";
import { NextResponse } from "next/server";

// ── Enum schemas ──────────────────────────────────────────────────────────────

export const FrequencySchema = z.enum(["monthly", "yearly", "weekly", "one_time"]);
export const ExpenseTypeSchema = z.enum(["JOINT", "PERSONAL"]);
export const PersonRoleSchema = z.enum(["self", "spouse", "dependent"]);

// ── Domain schemas ────────────────────────────────────────────────────────────

export const CreateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const CreatePersonSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  role: PersonRoleSchema.nullable().optional(),
});

export const UpdatePersonSchema = CreatePersonSchema.partial();

export const CreateIncomeSchema = z.object({
  personId: z.string().min(1, "Person is required"),
  name: z.string().min(1, "Name is required").max(100),
  amount: z.number({ invalid_type_error: "Amount must be a number" }).positive("Amount must be positive"),
  frequency: FrequencySchema,
  notes: z.string().max(500).nullable().optional(),
});

export const UpdateIncomeSchema = CreateIncomeSchema.omit({ personId: true }).partial();

export const CreateExpenseSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    amount: z.number({ invalid_type_error: "Amount must be a number" }).positive("Amount must be positive"),
    frequency: FrequencySchema,
    type: ExpenseTypeSchema,
    personId: z.string().nullable().optional(),
    categoryId: z.string().nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
  })
  .refine((d) => d.type !== "PERSONAL" || (d.personId && d.personId.length > 0), {
    message: "Person is required for personal expenses",
    path: ["personId"],
  });

export const UpdateExpenseSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    amount: z.number().positive().optional(),
    frequency: FrequencySchema.optional(),
    type: ExpenseTypeSchema.optional(),
    personId: z.string().nullable().optional(),
    categoryId: z.string().nullable().optional(),
    notes: z.string().max(500).nullable().optional(),
  })
  .refine((d) => d.type !== "PERSONAL" || d.personId === undefined || (d.personId && d.personId.length > 0), {
    message: "Person is required for personal expenses",
    path: ["personId"],
  });

export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

export function parseBody<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; response: NextResponse } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      response: NextResponse.json(
        { error: "Invalid request", details: result.error.issues },
        { status: 400 }
      ),
    };
  }
  return { success: true, data: result.data as z.infer<T> };
}

export async function wrapHandler(
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (err) {
    // Re-propagate thrown Response objects (e.g., 401 from requireUserId)
    if (err instanceof Response) return err as NextResponse;
    console.error("[api] Unhandled error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
