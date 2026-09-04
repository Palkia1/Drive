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
    include: { drivingSchool: true, user: { select: { emailVerified: true } } },
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
