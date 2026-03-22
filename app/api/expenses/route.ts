import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId, requireProfile } from "@/lib/auth-helpers";
import { CreateExpenseSchema, parseBody, wrapHandler } from "@/lib/validation";

export async function GET() {
  return wrapHandler(async () => {
    const userId = await requireUserId();
    const profile = await requireProfile(userId);

    const expenses = await db.expense.findMany({
      where: { profileId: profile.id },
      include: {
        person: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    });

    return NextResponse.json(expenses);
  });
}

export async function POST(req: NextRequest) {
  return wrapHandler(async () => {
    const userId = await requireUserId();
    const profile = await requireProfile(userId);

    const parsed = parseBody(CreateExpenseSchema, await req.json());
    if (!parsed.success) return parsed.response;

    // Verify person belongs to this profile (if provided)
    if (parsed.data.personId) {
      const person = await db.person.findFirst({
        where: { id: parsed.data.personId, profileId: profile.id },
      });
      if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    // Verify category belongs to this profile (if provided)
    if (parsed.data.categoryId) {
      const category = await db.category.findFirst({
        where: { id: parsed.data.categoryId, profileId: profile.id },
      });
      if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const expense = await db.expense.create({
      data: {
        profileId: profile.id,
        name: parsed.data.name,
        amount: parsed.data.amount,
        frequency: parsed.data.frequency,
        type: parsed.data.type,
        personId: parsed.data.personId ?? null,
        categoryId: parsed.data.categoryId ?? null,
        notes: parsed.data.notes ?? null,
      },
      include: {
        person: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(expense, { status: 201 });
  });
}
