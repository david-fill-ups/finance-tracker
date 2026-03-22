import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId } from "@/lib/auth-helpers";
import { CreateProfileSchema, parseBody, wrapHandler } from "@/lib/validation";

export async function GET() {
  return wrapHandler(async () => {
    const userId = await requireUserId();
    const profile = await db.profile.findUnique({ where: { userId } });
    if (!profile) return NextResponse.json(null);
    return NextResponse.json(profile);
  });
}

export async function POST(req: NextRequest) {
  return wrapHandler(async () => {
    const userId = await requireUserId();

    // Only one profile per user
    const existing = await db.profile.findUnique({ where: { userId } });
    if (existing) {
      return NextResponse.json({ error: "Profile already exists" }, { status: 409 });
    }

    const parsed = parseBody(CreateProfileSchema, await req.json());
    if (!parsed.success) return parsed.response;

    const profile = await db.profile.create({
      data: { userId, name: parsed.data.name },
    });

    return NextResponse.json(profile, { status: 201 });
  });
}

export async function PATCH(req: NextRequest) {
  return wrapHandler(async () => {
    const userId = await requireUserId();
    const parsed = parseBody(CreateProfileSchema, await req.json());
    if (!parsed.success) return parsed.response;

    const profile = await db.profile.update({
      where: { userId },
      data: { name: parsed.data.name },
    });

    return NextResponse.json(profile);
  });
}
