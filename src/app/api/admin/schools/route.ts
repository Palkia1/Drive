import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isValidAdminKey } from "@/lib/adminKey";
import { checkRateLimit, clientIp } from "@/lib/rateLimit";

/**
 * Lists every driving school with its license so the platform owner can see
 * who's requesting more seats and decide — gated by SEED_KEY like the other
 * admin routes, but via an `x-admin-key` header rather than a `?key=`
 * querystring (a GET here is read-only, but the key itself shouldn't end up
 * in server/proxy logs or a Referer header either way).
 */
export async function GET(req: Request) {
  const allowed = await checkRateLimit(`admin-schools:${clientIp(req)}`, 20);
  if (!allowed) {
    return NextResponse.json({ error: "Te veel pogingen. Probeer het over een minuut opnieuw." }, { status: 429 });
  }

  const key = req.headers.get("x-admin-key");
  if (!isValidAdminKey(key)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schools = await prisma.drivingSchool.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      code: true,
      createdAt: true,
      owner: { select: { email: true, name: true } },
      license: { select: { seats: true, plan: true, status: true, currentPeriodEnd: true } },
      _count: { select: { students: true } },
    },
  });

  return NextResponse.json({
    schools: schools.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      createdAt: s.createdAt,
      ownerEmail: s.owner.email,
      ownerName: s.owner.name,
      seatsUsed: s._count.students,
      seats: s.license?.seats ?? 0,
      plan: s.license?.plan ?? null,
      status: s.license?.status ?? null,
    })),
  });
}
