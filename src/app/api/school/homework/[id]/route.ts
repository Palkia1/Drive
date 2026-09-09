import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteHomework } from "@/lib/homework";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "INSTRUCTOR") {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const school = await prisma.drivingSchool.findUnique({ where: { ownerId: session.user.id } });
  if (!school) return NextResponse.json({ error: "Geen rijschool" }, { status: 404 });

  const { id } = await params;
  const result = await deleteHomework(school.id, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 404 });
  return NextResponse.json(result);
}
