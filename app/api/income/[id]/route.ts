import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId, requireProfile } from "@/lib/auth-helpers";
import { UpdateIncomeSchema, parseBody, wrapHandler } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

async function resolveIncome(userId: string, incomeId: string) {
  const profile = await requireProfile(userId);
  const income = await db.incomeSource.findFirst({
    where: { id: incomeId, person: { profileId: profile.id } },
  });
  if (!income) throw Response.json({ error: "Not found" }, { status: 404 });
  return income;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  return wrapHandler(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    await resolveIncome(userId, id);

    const parsed = parseBody(UpdateIncomeSchema, await req.json());
    if (!parsed.success) return parsed.response;

    const updated = await db.incomeSource.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.amount !== undefined && { amount: parsed.data.amount }),
        ...(parsed.data.frequency !== undefined && { frequency: parsed.data.frequency }),
        ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
      },
    });

    return NextResponse.json(updated);
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return wrapHandler(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    await resolveIncome(userId, id);

    await db.incomeSource.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  });
}
