export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const mix = (a, b, t) => a + (b - a) * t;
export const smooth = x => { x = clamp(x); return x * x * (3 - 2 * x); };
export const ramp = (t, a, b) => smooth((t - a) / (b - a));
export const TAU = Math.PI * 2;
export function random(seed = 19) {
  let s = seed >>> 0;
  return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; };
}
export function curve(keys, t) {
  let i = 0;
  while (i < keys.length - 2 && t > keys[i + 1][0]) i++;
  const [a, p] = keys[i], [b, q] = keys[i + 1], d = b - a, u = clamp((t - a) / d);
  const tangent = k => {
    const left = keys[Math.max(0, k - 1)], mid = keys[k], right = keys[Math.min(keys.length - 1, k + 1)];
    if (k === 0 || k === keys.length - 1) return mid[1].map(() => 0);
    return mid[1].map((_, c) => {
      const l = (mid[1][c] - left[1][c]) / (mid[0] - left[0]);
      const r = (right[1][c] - mid[1][c]) / (right[0] - mid[0]);
      // Monotone cubic: shared velocity at knots, no overshoot or recurring stops.
      return l * r <= 0 ? 0 : 2 * l * r / (l + r);
    });
  };
  const m = tangent(i), n = tangent(i + 1), u2 = u * u, u3 = u2 * u;
  return p.map((v, c) => (2*u3-3*u2+1)*v + (u3-2*u2+u)*d*m[c] + (-2*u3+3*u2)*q[c] + (u3-u2)*d*n[c]);
}
export function cameraPath(keys, t) {
  const v = curve(keys, t);
  return { position: v.slice(0, 3), target: v.slice(3, 6), fov: v[6] };
}

// A small reproducible attention demonstration, not a claim to expose a real model.
export function attentionFixture(n = 16, d = 12) {
  const rnd = random(8127);
  const input = Array.from({ length: n }, (_, i) => Array.from({ length: d }, (_, k) =>
    .55 * Math.sin(i * .53 + k * .41) + .45 * (rnd() * 2 - 1)));
  const weights = Array.from({ length: 3 }, () => Array.from({ length: d }, () =>
    Array.from({ length: d }, () => (rnd() * 2 - 1) / Math.sqrt(d))));
  const project = w => input.map(row => w.map((_, j) => row.reduce((s, x, k) => s + x * w[k][j], 0)));
  const [q, k, v] = weights.map(project);
  const scores = q.map((row, i) => k.map((key, j) => j <= i ? row.reduce((s, x, c) => s + x*key[c], 0) / Math.sqrt(d) : -Infinity));
  const attention = scores.map(row => {
    const max = Math.max(...row), exp = row.map(x => Number.isFinite(x) ? Math.exp(x-max) : 0), sum = exp.reduce((a,b)=>a+b,0);
    return exp.map(x => x / sum);
  });
  const output = attention.map(row => Array.from({ length: d }, (_, c) => row.reduce((s, w, j) => s + w*v[j][c], 0)));
  return { n, d, input, q, k, v, scores, attention, output, stages: [input, q, k, v, output] };
}
