import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createChallengeSchema } from "@/lib/validation";
import { createChallenge, getChallengesForStudent } from "@/lib/challenges";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const me = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
  if (!me) return NextResponse.json({ error: "Geen leerlingprofiel" }, { status: 404 });

  const challenges = await getChallengesForStudent(me.id);
  return NextResponse.json({ challenges });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const me = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
  if (!me) return NextResponse.json({ error: "Geen leerlingprofiel" }, { status: 404 });

  const parsed = createChallengeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ongeldige invoer" }, { status: 400 });
  }
  if (parsed.data.metric === "topic_accuracy" && parsed.data.topicId) {
    const topic = await prisma.topic.findUnique({ where: { id: parsed.data.topicId }, select: { id: true } });
    if (!topic) return NextResponse.json({ error: "Onbekend onderwerp" }, { status: 400 });
  }

  const id = await createChallenge(me.id, parsed.data);
  return NextResponse.json({ ok: true, id });
}
