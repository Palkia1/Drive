import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getBetaTester } from "@/lib/session";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("APPROVED"), note: z.string().max(2000).optional() }),
  z.object({ action: z.literal("DISCARDED"), note: z.string().max(2000).optional() }),
  z.object({
    action: z.literal("EDITED_PROMPT"),
    prompt: z.string().min(1).max(2000),
    explanation: z.string().max(4000).nullable().optional(),
    note: z.string().max(2000).optional(),
  }),
  z.object({
    action: z.literal("EDITED_ANSWERS"),
    scene: z.record(z.string(), z.unknown()),
    note: z.string().max(2000).optional(),
  }),
]);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const tester = await getBetaTester();
  if (!tester) return NextResponse.json({ error: "Geen toegang" }, { status: 403 });

  const { id } = await params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ongeldige invoer" }, { status: 400 });
  const body = parsed.data;

  const question = await prisma.question.findUnique({ where: { id } });
  if (!question) return NextResponse.json({ error: "Vraag niet gevonden" }, { status: 404 });

  if (body.action === "APPROVED") {
    await prisma.questionReview.create({ data: { questionId: id, testerId: tester.id, action: "APPROVED", note: body.note } });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "DISCARDED") {
    await prisma.$transaction([
      prisma.question.update({ where: { id }, data: { status: "ARCHIVED" } }),
      prisma.questionReview.create({ data: { questionId: id, testerId: tester.id, action: "DISCARDED", note: body.note } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "EDITED_PROMPT") {
    await prisma.$transaction([
      prisma.question.update({
        where: { id },
        data: { prompt: body.prompt, explanation: body.explanation ?? null, version: { increment: 1 } },
      }),
      prisma.questionReview.create({ data: { questionId: id, testerId: tester.id, action: "EDITED_PROMPT", note: body.note } }),
    ]);
    return NextResponse.json({ ok: true });
  }

  // EDITED_ANSWERS — only allow overwriting a scene of the same shape as the
  // one already stored, so a malformed edit can't silently swap a question
  // to a scene kind its renderer doesn't expect.
  let existingScene: { kind?: unknown; sceneId?: unknown };
  try {
    existingScene = JSON.parse(question.scene);
  } catch {
    return NextResponse.json({ error: "Bestaande scene is corrupt" }, { status: 500 });
  }
  const newScene = body.scene as { kind?: unknown; sceneId?: unknown };
  if (
    newScene.kind !== existingScene.kind ||
    (existingScene.kind === "HOTSPOT" && newScene.sceneId !== existingScene.sceneId)
  ) {
    return NextResponse.json({ error: "Scene-type komt niet overeen" }, { status: 400 });
  }
  await prisma.$transaction([
    prisma.question.update({ where: { id }, data: { scene: JSON.stringify(newScene), version: { increment: 1 } } }),
    prisma.questionReview.create({ data: { questionId: id, testerId: tester.id, action: "EDITED_ANSWERS", note: body.note } }),
  ]);
  return NextResponse.json({ ok: true });
}
