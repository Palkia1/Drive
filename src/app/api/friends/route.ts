import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const bodySchema = z.object({ friendCode: z.string().trim().toUpperCase().min(3) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
  }
  const me = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
  if (!me) return NextResponse.json({ error: "Geen leerlingprofiel" }, { status: 404 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });

  const target = await prisma.studentProfile.findUnique({ where: { friendCode: parsed.data.friendCode } });
  if (!target) return NextResponse.json({ error: "Geen gebruiker gevonden met deze code." }, { status: 404 });
  if (target.id === me.id) return NextResponse.json({ error: "Je kunt jezelf niet toevoegen." }, { status: 400 });

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: me.id, addresseeId: target.id },
        { requesterId: target.id, addresseeId: me.id },
      ],
    },
  });
  if (existing) {
    return NextResponse.json(
      { error: existing.status === "ACCEPTED" ? "Jullie zijn al vrienden." : "Er staat al een verzoek open." },
      { status: 409 }
    );
  }

  await prisma.friendship.create({ data: { requesterId: me.id, addresseeId: target.id } });
  return NextResponse.json({ ok: true, addedUsername: target.username });
}
