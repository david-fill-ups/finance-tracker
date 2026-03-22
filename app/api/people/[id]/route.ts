import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId, requireProfile } from "@/lib/auth-helpers";
import { UpdatePersonSchema, parseBody, wrapHandler } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

async function resolvePerson(userId: string, personId: string) {
  const profile = await requireProfile(userId);
  const person = await db.person.findFirst({
    where: { id: personId, profileId: profile.id },
  });
  if (!person) throw Response.json({ error: "Not found" }, { status: 404 });
  return person;
}

export async function PATCH(req: NextRequest, { params }: Params) {
  return wrapHandler(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    await resolvePerson(userId, id);

    const parsed = parseBody(UpdatePersonSchema, await req.json());
    if (!parsed.success) return parsed.response;

    const updated = await db.person.update({
      where: { id },
      data: {
        ...(parsed.data.name !== undefined && { name: parsed.data.name }),
        ...(parsed.data.role !== undefined && { role: parsed.data.role }),
      },
    });

    return NextResponse.json(updated);
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return wrapHandler(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    await resolvePerson(userId, id);

    await db.person.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  });
}
