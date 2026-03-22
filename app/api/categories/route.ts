import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId, requireProfile } from "@/lib/auth-helpers";
import { CreateCategorySchema, parseBody, wrapHandler } from "@/lib/validation";

export async function GET() {
  return wrapHandler(async () => {
    const userId = await requireUserId();
    const profile = await requireProfile(userId);

    const categories = await db.category.findMany({
      where: { profileId: profile.id },
      include: { _count: { select: { expenses: true } } },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(categories);
  });
}

export async function POST(req: NextRequest) {
  return wrapHandler(async () => {
    const userId = await requireUserId();
    const profile = await requireProfile(userId);

    const parsed = parseBody(CreateCategorySchema, await req.json());
    if (!parsed.success) return parsed.response;

    // Check for duplicate
    const existing = await db.category.findUnique({
      where: { name_profileId: { name: parsed.data.name, profileId: profile.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }

    const category = await db.category.create({
      data: { profileId: profile.id, name: parsed.data.name },
    });

    return NextResponse.json(category, { status: 201 });
  });
}
