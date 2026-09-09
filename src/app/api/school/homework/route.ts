import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { assignHomeworkSchema } from "@/lib/validation";
import { assignHomework } from "@/lib/homework";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const school = await prisma.drivingSchool.findUnique({ where: { ownerId: session.user.id } });
  if (!school) return NextResponse.json({ error: "Geen rijschool" }, { status: 404 });

  const parsed = assignHomeworkSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ongeldige invoer" }, { status: 400 });
  }

  const result = await assignHomework(school.id, session.user.id, parsed.data);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result);
}
