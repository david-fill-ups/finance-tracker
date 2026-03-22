import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import CategoriesClient from "@/components/categories/categories-client";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await db.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) redirect("/setup");

  const categories = await db.category.findMany({
    where: { profileId: profile.id },
    include: { _count: { select: { expenses: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Categories</h1>
        <p className="text-slate-400 text-sm mt-1">Organize expenses into categories.</p>
      </div>
      <CategoriesClient categories={JSON.parse(JSON.stringify(categories))} />
    </div>
  );
}
