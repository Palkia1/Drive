import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isValidAdminKey } from "@/lib/adminKey";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";
import { adminUpdateSchoolSchema } from "@/lib/validation";

/**
 * The only way a school's seat count changes after signup — self-service
 * registration always starts a school on the small TRIAL_SEATS allowance
 * (see /api/register-school); raising it, or suspending a school's join
 * code entirely, is a deliberate action the platform owner takes here.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const allowed = await checkRateLimit(`admin-schools:${clientIp(req)}`, 20);
  if (!allowed) {
    return NextResponse.json({ error: "Te veel pogingen. Probeer het over een minuut opnieuw." }, { status: 429 });
  }

  const key = req.headers.get("x-admin-key");
  if (!isValidAdminKey(key)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = adminUpdateSchoolSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Ongeldige invoer" }, { status: 400 });
  }

  const school = await prisma.drivingSchool.findUnique({ where: { id }, select: { id: true } });
  if (!school) {
    return NextResponse.json({ error: "Rijschool niet gevonden" }, { status: 404 });
  }

  const license = await prisma.license.findUnique({ where: { drivingSchoolId: id } });
  if (!license) {
    return NextResponse.json({ error: "Deze rijschool heeft geen licentie" }, { status: 404 });
  }

  const updated = await prisma.license.update({
    where: { drivingSchoolId: id },
    data: {
      ...(parsed.data.seats !== undefined ? { seats: parsed.data.seats } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
    },
  });

  return NextResponse.json({ ok: true, seats: updated.seats, status: updated.status });
}
