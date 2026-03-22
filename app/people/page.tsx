import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import PeopleClient from "@/components/people/people-client";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await db.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) redirect("/setup");

  const people = await db.person.findMany({
    where: { profileId: profile.id },
    include: { incomes: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">People</h1>
        <p className="text-slate-400 text-sm mt-1">Manage household members and their roles.</p>
      </div>
      <PeopleClient people={JSON.parse(JSON.stringify(people))} />
    </div>
  );
}
