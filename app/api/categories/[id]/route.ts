import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId, requireProfile } from "@/lib/auth-helpers";
import { CreateCategorySchema, parseBody, wrapHandler } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

async function resolveCategory(userId: string, categoryId: string) {
  const profile = await requireProfile(userId);
  const category = await db.category.findFirst({
    where: { id: categoryId, profileId: profile.id },
  });
  if (!category) throw Response.json({ error: "Not found" }, { status: 404 });
  return { category, profile };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  return wrapHandler(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    const { profile } = await resolveCategory(userId, id);

    const parsed = parseBody(CreateCategorySchema, await req.json());
    if (!parsed.success) return parsed.response;

    // Check for duplicate name (excluding self)
    const existing = await db.category.findFirst({
      where: { name: parsed.data.name, profileId: profile.id, NOT: { id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Category name already exists" }, { status: 409 });
    }

    const updated = await db.category.update({
      where: { id },
      data: { name: parsed.data.name },
    });

    return NextResponse.json(updated);
  });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  return wrapHandler(async () => {
    const userId = await requireUserId();
    const { id } = await params;
    await resolveCategory(userId, id);

    await db.category.delete({ where: { id } });

    return NextResponse.json({ ok: true });
  });
}
