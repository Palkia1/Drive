import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

/** For pages under /app/* — redirects to login, or to the school dashboard if this account is an instructor. */
export async function requireStudent() {
  const session = await auth();
  if (!session?.user) redirect("/inloggen");
  if (session.user.role !== "STUDENT") redirect("/school");

  const student = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: { drivingSchool: true, user: { select: { emailVerified: true, isBetaTester: true } } },
  });
  if (!student) redirect("/inloggen");
  return { user: session.user, student };
}

/** For pages under /school/* — redirects to login, or to the student app if this account is a student. */
export async function requireInstructor() {
  const session = await auth();
  if (!session?.user) redirect("/inloggen");
  if (session.user.role !== "INSTRUCTOR") redirect("/app");

  const school = await prisma.drivingSchool.findUnique({
    where: { ownerId: session.user.id },
    include: { license: true },
  });
  if (!school) redirect("/inloggen");
  return { user: session.user, school };
}

/** For the /app/beta page — any account can self-grant isBetaTester from
 * Instellingen, so this only checks the flag, not the STUDENT/INSTRUCTOR
 * role. Redirects a signed-in non-tester back to /app. */
export async function requireBetaTester() {
  const user = await getBetaTester();
  if (!user) redirect("/app");
  return user;
}

/** For /api/beta/* routes — same check as requireBetaTester, but returns
 * null instead of redirecting so the route can reply with a JSON 401/403. */
export async function getBetaTester() {
  const session = await auth();
  if (!session?.user) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, isBetaTester: true, name: true },
  });
  if (!user?.isBetaTester) return null;
  return user;
}
