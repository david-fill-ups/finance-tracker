import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId, requireProfile } from "@/lib/auth-helpers";
import { UpdateExpenseSchema, parseBody, wrapHandler } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

async function resolveExpense(userId: string, expenseId: string) {
  const profile = await requireProfile(userId);
  const expense = await db.expense.findFirst({
    where: { id: expenseId, profileId: profile.id },
  });
  if (!expense) throw Response.json({ error: "Not found" }, { status: 404 });
  return { expense, profile };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  return wrapHandler(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    const { profile } = await resolveExpense(userId, id);

    const parsed = parseBody(UpdateExpenseSchema, await req.json());
    if (!parsed.success) return parsed.response;

    // Validate person if changing
    if (parsed.data.personId) {
      const person = await db.person.findFirst({
        where: { id: parsed.data.personId, profileId: profile.id },
      });
      if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    // Validate category if changing
    if (parsed.data.categoryId) {
      const category = await db.category.findFirst({
        where: { id: parsed.data.categoryId, profileId: profile.id },
      });
      if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const updated = await db.expense.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.amount !== undefined && { amount: parsed.data.amount }),
        ...(parsed.data.frequency !== undefined && { frequency: parsed.data.frequency }),
        ...(parsed.data.type !== undefined && { type: parsed.data.type }),
        ...(parsed.data.personId !== undefined && { personId: parsed.data.personId }),
        ...(parsed.data.categoryId !== undefined && { categoryId: parsed.data.categoryId }),
        ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
      },
      include: {
        person: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return wrapHandler(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    await resolveExpense(userId, id);

    await db.expense.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  });
}
