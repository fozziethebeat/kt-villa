/**
 * Trace engine (§5.2 "Craft: trace a path"): follow a blueprint line with the cursor.
 * Used for the first module build at Snow Peak; later for sign painting / wax tuning.
 */
export type Pt = [number, number];

/** Evenly spaced points along a polyline. */
export function resample(path: Pt[], step: number): Pt[] {
  if (path.length < 2) return [...path];
  const out: Pt[] = [path[0]];
  let carry = 0;
  for (let i = 1; i < path.length; i++) {
    const [ax, ay] = path[i - 1], [bx, by] = path[i];
    const seg = Math.hypot(bx - ax, by - ay);
    let t = step - carry;
    while (t <= seg) { out.push([ax + ((bx - ax) * t) / seg, ay + ((by - ay) * t) / seg]); t += step; }
    carry = seg - (t - step);
  }
  return out;
}

function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const [px, py] = p, [ax, ay] = a, [bx, by] = b;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function distToPath(p: Pt, path: Pt[]): number {
  let d = Infinity;
  for (let i = 1; i < path.length; i++) d = Math.min(d, distToSegment(p, path[i - 1], path[i]));
  return d;
}

/** coverage: how much of the guide was traced; accuracy: how much of the stroke stayed on the line. */
export function scoreTrace(guide: Pt[], drawn: Pt[] | Pt[][], tol: number): { coverage: number; accuracy: number; stars: number } {
  // Accept one stroke or several (pen lifted between them); never bridge the gap between strokes.
  const strokes = (drawn.length && typeof (drawn as Pt[])[0][0] === 'number' ? [drawn as Pt[]] : (drawn as Pt[][])).filter((st) => st.length);
  if (!strokes.length) return { coverage: 0, accuracy: 0, stars: 0 };
  const samples = resample(guide, tol / 2);
  const stroke = strokes.flatMap((st) => (st.length > 1 ? resample(st, tol / 3) : st));
  const covered = samples.filter((s) => stroke.some((d) => Math.hypot(d[0] - s[0], d[1] - s[1]) <= tol)).length;
  const onLine = stroke.filter((d) => distToPath(d, guide) <= tol).length;
  const coverage = covered / samples.length;
  const accuracy = onLine / stroke.length;
  const stars = coverage >= 0.9 && accuracy >= 0.85 ? 3 : coverage >= 0.7 && accuracy >= 0.65 ? 2 : 1;
  return { coverage, accuracy, stars };
}
