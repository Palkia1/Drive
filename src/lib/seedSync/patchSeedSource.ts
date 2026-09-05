import ts from "typescript";

/**
 * Text-splicing edits to prisma/seed.ts's hand-authored QUESTIONS array,
 * keyed off each object literal's own `seedId` property — deliberately NOT
 * implemented by reprinting the AST (ts.Printer doesn't reliably preserve
 * the file's many hand-written comments), but by finding exact character
 * offsets via the parser and replacing only those spans in the raw text.
 * Everything else in the ~7000-line file is untouched byte-for-byte.
 */

function findQuestionsArray(sourceFile: ts.SourceFile): ts.ArrayLiteralExpression {
  let found: ts.ArrayLiteralExpression | null = null;
  const visit = (node: ts.Node) => {
    if (found) return;
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "QUESTIONS" &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      found = node.initializer;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  if (!found) throw new Error("Could not find `const QUESTIONS: SeedQuestion[] = [...]` in seed.ts");
  return found;
}

function findProperty(obj: ts.ObjectLiteralExpression, name: string): ts.PropertyAssignment | undefined {
  return obj.properties.find(
    (p): p is ts.PropertyAssignment => ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === name
  );
}

function stringLiteralValue(node: ts.Expression): string | null {
  return ts.isStringLiteralLike(node) ? node.text : null;
}

/** Adds a `seedId: "sq-0001"` (sequential, 4-digit) as the first property of
 * every QUESTIONS object literal that doesn't already have one. Idempotent —
 * entries that already carry a seedId are left untouched and don't consume a
 * new number, so re-running after partially adding ids is safe. */
export function injectMissingSeedIds(sourceText: string): { text: string; added: number } {
  const sourceFile = ts.createSourceFile("seed.ts", sourceText, ts.ScriptTarget.Latest, true);
  const arrayNode = findQuestionsArray(sourceFile);

  let maxExisting = 0;
  for (const el of arrayNode.elements) {
    if (!ts.isObjectLiteralExpression(el)) continue;
    const prop = findProperty(el, "seedId");
    if (!prop) continue;
    const value = stringLiteralValue(prop.initializer);
    const match = value?.match(/^sq-(\d+)$/);
    if (match) maxExisting = Math.max(maxExisting, parseInt(match[1], 10));
  }

  const inserts: { pos: number; text: string }[] = [];
  let next = maxExisting + 1;
  for (const el of arrayNode.elements) {
    if (!ts.isObjectLiteralExpression(el)) continue;
    if (findProperty(el, "seedId")) continue;
    const openBrace = el.getFirstToken(sourceFile);
    if (!openBrace || openBrace.kind !== ts.SyntaxKind.OpenBraceToken) continue;
    const id = `sq-${String(next).padStart(4, "0")}`;
    next++;
    inserts.push({ pos: openBrace.getEnd(), text: `\n    seedId: "${id}",` });
  }

  inserts.sort((a, b) => b.pos - a.pos);
  let result = sourceText;
  for (const ins of inserts) {
    result = result.slice(0, ins.pos) + ins.text + result.slice(ins.pos);
  }
  return { text: result, added: inserts.length };
}

export type SeedQuestionPatch = {
  prompt?: string;
  explanation?: string;
  scene?: unknown;
  archived?: boolean;
};

/** Finds the QUESTIONS object literal whose `seedId` matches, and rewrites
 * only the given fields' value spans in place. Returns the original text
 * unchanged (and `found: false`) if no entry has that seedId — the caller
 * should treat that as "nothing to sync" rather than an error, since it's
 * the expected case for procedurally-generated (non-seedId) questions. */
export function patchQuestionBySeedId(
  sourceText: string,
  seedId: string,
  patch: SeedQuestionPatch
): { text: string; found: boolean; changed: boolean } {
  const sourceFile = ts.createSourceFile("seed.ts", sourceText, ts.ScriptTarget.Latest, true);
  const arrayNode = findQuestionsArray(sourceFile);

  for (const el of arrayNode.elements) {
    if (!ts.isObjectLiteralExpression(el)) continue;
    const seedIdProp = findProperty(el, "seedId");
    if (!seedIdProp || stringLiteralValue(seedIdProp.initializer) !== seedId) continue;

    const edits: { start: number; end: number; text: string }[] = [];

    if (patch.prompt !== undefined) {
      const prop = findProperty(el, "prompt");
      if (prop) edits.push({ start: prop.initializer.getStart(sourceFile), end: prop.initializer.getEnd(), text: JSON.stringify(patch.prompt) });
    }
    if (patch.explanation !== undefined) {
      const prop = findProperty(el, "explanation");
      if (prop) edits.push({ start: prop.initializer.getStart(sourceFile), end: prop.initializer.getEnd(), text: JSON.stringify(patch.explanation) });
    }
    if (patch.scene !== undefined) {
      const prop = findProperty(el, "scene");
      if (prop) edits.push({ start: prop.initializer.getStart(sourceFile), end: prop.initializer.getEnd(), text: JSON.stringify(patch.scene, null, 2) });
    }
    if (patch.archived !== undefined) {
      const prop = findProperty(el, "archived");
      if (prop) {
        edits.push({ start: prop.initializer.getStart(sourceFile), end: prop.initializer.getEnd(), text: String(patch.archived) });
      } else {
        edits.push({ start: seedIdProp.getEnd(), end: seedIdProp.getEnd(), text: `\n    archived: ${patch.archived},` });
      }
    }

    if (edits.length === 0) return { text: sourceText, found: true, changed: false };
    edits.sort((a, b) => b.start - a.start);
    let result = sourceText;
    for (const e of edits) {
      result = result.slice(0, e.start) + e.text + result.slice(e.end);
    }
    return { text: result, found: true, changed: true };
  }

  return { text: sourceText, found: false, changed: false };
}
