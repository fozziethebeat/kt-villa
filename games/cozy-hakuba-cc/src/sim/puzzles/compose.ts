/**
 * Composition engine (§5.3): frame a photo of a wide panorama. Rules say what must be in the shot, what must be
 * left out, and which subject should sit on a rule-of-thirds point. Handmade layouts (no generator needed).
 */
export interface Subject { id: string; label: string; x: number; y: number }
export type Rule = { kind: 'include' | 'exclude' | 'thirds'; id: string };
export interface ComposePuzzle { W: number; H: number; frame: { w: number; h: number }; subjects: Subject[]; rules: Rule[] }
export type RuleStatus = { rule: Rule; ok: boolean };

export function clampFrame(p: ComposePuzzle, x: number, y: number): [number, number] {
  return [Math.max(0, Math.min(p.W - p.frame.w, x)), Math.max(0, Math.min(p.H - p.frame.h, y))];
}

function inside(p: ComposePuzzle, fx: number, fy: number, s: Subject): boolean {
  return s.x >= fx && s.x <= fx + p.frame.w && s.y >= fy && s.y <= fy + p.frame.h;
}

/** Near one of the four thirds intersections (tolerance: 8% of width, 10% of height). */
export function onThirds(p: ComposePuzzle, fx: number, fy: number, s: Subject): boolean {
  const { w, h } = p.frame;
  const xs = [fx + w / 3, fx + (2 * w) / 3], ys = [fy + h / 3, fy + (2 * h) / 3];
  return xs.some((x) => Math.abs(s.x - x) <= w * 0.08) && ys.some((y) => Math.abs(s.y - y) <= h * 0.1);
}

export function evaluate(p: ComposePuzzle, fx: number, fy: number): { rules: RuleStatus[]; solved: boolean } {
  const subj = (id: string) => p.subjects.find((s) => s.id === id)!;
  const rules = p.rules.map((rule) => {
    const s = subj(rule.id);
    const ok = rule.kind === 'include' ? inside(p, fx, fy, s) : rule.kind === 'exclude' ? !inside(p, fx, fy, s) : inside(p, fx, fy, s) && onThirds(p, fx, fy, s);
    return { rule, ok };
  });
  return { rules, solved: rules.every((r) => r.ok) };
}

export function describeRule(p: ComposePuzzle, r: Rule): string {
  const label = p.subjects.find((s) => s.id === r.id)!.label;
  return r.kind === 'include' ? `Include ${label}` : r.kind === 'exclude' ? `Leave out ${label}` : `Put ${label} on a thirds point`;
}

/** Search for a frame position that satisfies every rule (used for hints and to prove handmade puzzles work). */
export function solveCompose(p: ComposePuzzle, step = 4): [number, number] | null {
  for (let x = 0; x <= p.W - p.frame.w; x += step) for (let y = 0; y <= p.H - p.frame.h; y += step) if (evaluate(p, x, y).solved) return [x, y];
  return null;
}
