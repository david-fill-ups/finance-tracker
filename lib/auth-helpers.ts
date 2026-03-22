import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * Returns the authenticated userId from the JWT session.
 * Throws a 401 Response if not authenticated.
 */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session.user.id;
}

/**
 * Returns the profile for the given userId, or null if not found.
 */
export async function getProfile(userId: string) {
  return db.profile.findUnique({ where: { userId } });
}

/**
 * Returns the profile for the given userId.
 * Throws a 404 Response if no profile exists.
 */
export async function requireProfile(userId: string) {
  const profile = await getProfile(userId);
  if (!profile) {
    throw Response.json({ error: "Profile not found. Please complete setup." }, { status: 404 });
  }
  return profile;
}
