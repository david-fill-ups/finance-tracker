import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId, requireProfile } from "@/lib/auth-helpers";
import { CreatePersonSchema, parseBody, wrapHandler } from "@/lib/validation";

export async function GET() {
  return wrapHandler(async () => {
    const userId = await requireUserId();
    const profile = await requireProfile(userId);

    const people = await db.person.findMany({
      where: { profileId: profile.id },
      include: {
        incomes: { orderBy: { createdAt: "asc" } },
        _count: { select: { expenses: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(people);
  });
}

export async function POST(req: NextRequest) {
  return wrapHandler(async () => {
    const userId = await requireUserId();
    const profile = await requireProfile(userId);

    const parsed = parseBody(CreatePersonSchema, await req.json());
    if (!parsed.success) return parsed.response;

    const person = await db.person.create({
      data: { profileId: profile.id, name: parsed.data.name, role: parsed.data.role ?? null },
    });

    return NextResponse.json(person, { status: 201 });
  });
}
