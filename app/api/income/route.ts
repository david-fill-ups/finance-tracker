import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId, requireProfile } from "@/lib/auth-helpers";
import { CreateIncomeSchema, parseBody, wrapHandler } from "@/lib/validation";

export async function GET() {
  return wrapHandler(async () => {
    const userId = await requireUserId();
    const profile = await requireProfile(userId);

    const income = await db.incomeSource.findMany({
      where: { person: { profileId: profile.id } },
      include: { person: { select: { id: true, name: true } } },
      orderBy: [{ person: { name: "asc" } }, { createdAt: "asc" }],
    });

    return NextResponse.json(income);
  });
}

export async function POST(req: NextRequest) {
  return wrapHandler(async () => {
    const userId = await requireUserId();
    const profile = await requireProfile(userId);

    const parsed = parseBody(CreateIncomeSchema, await req.json());
    if (!parsed.success) return parsed.response;

    // Verify person belongs to this profile
    const person = await db.person.findFirst({
      where: { id: parsed.data.personId, profileId: profile.id },
    });
    if (!person) return NextResponse.json({ error: "Person not found" }, { status: 404 });

    const income = await db.incomeSource.create({
      data: {
        personId: parsed.data.personId,
        name: parsed.data.name,
        amount: parsed.data.amount,
        frequency: parsed.data.frequency,
        notes: parsed.data.notes ?? null,
      },
    });

    return NextResponse.json(income, { status: 201 });
  });
}
