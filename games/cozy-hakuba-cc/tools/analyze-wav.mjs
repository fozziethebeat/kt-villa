// Objective checks for rendered music (Claude can't listen, so these stand in for a first pass).

/** Parse a 16-bit PCM WAV into a mono Float32Array. */
export function readWav(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ch = dv.getUint16(22, true), sr = dv.getUint32(24, true);
  let off = 12;
  while (off < dv.byteLength - 8) {
    const id = String.fromCharCode(dv.getUint8(off), dv.getUint8(off + 1), dv.getUint8(off + 2), dv.getUint8(off + 3));
    const size = dv.getUint32(off + 4, true);
    if (id === 'data') {
      const n = size / 2 / ch, mono = new Float32Array(n);
      for (let i = 0; i < n; i++) { let s = 0; for (let c = 0; c < ch; c++) s += dv.getInt16(off + 8 + (i * ch + c) * 2, true) / 32768; mono[i] = s / ch; }
      return { sr, mono };
    }
    off += 8 + size;
  }
  throw new Error('no data chunk');
}

const db = (x) => (x > 0 ? 20 * Math.log10(x) : -120);
const rms = (a, s, e) => { let t = 0; for (let i = s; i < e; i++) t += a[i] * a[i]; return Math.sqrt(t / Math.max(1, e - s)); };

function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len) for (let k = 0; k < len / 2; k++) {
      const wr = Math.cos(ang * k), wi = Math.sin(ang * k);
      const ur = re[i + k], ui = im[i + k];
      const vr = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi, vi = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr;
      re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
    }
  }
}

/** Share of spectral energy in low (<250 Hz), mid (250 Hz–4 kHz) and high (>4 kHz) bands, in %. */
function bands(a, sr) {
  const N = 4096, acc = { low: 0, mid: 0, high: 0 };
  for (let s = 0; s + N < a.length; s += N * 4) {
    const re = new Float64Array(N), im = new Float64Array(N);
    for (let i = 0; i < N; i++) re[i] = a[s + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));
    fft(re, im);
    for (let k = 1; k < N / 2; k++) { const f = (k * sr) / N, p = re[k] * re[k] + im[k] * im[k]; if (f < 250) acc.low += p; else if (f < 4000) acc.mid += p; else acc.high += p; }
  }
  const tot = acc.low + acc.mid + acc.high || 1;
  return { low: Math.round((100 * acc.low) / tot), mid: Math.round((100 * acc.mid) / tot), high: Math.round((100 * acc.high) / tot) };
}

export function analyzeWav(bytes, loopSeconds) {
  const { sr, mono } = readWav(bytes);
  const bodyEnd = Math.floor(sr * loopSeconds * 2); // ignore the reverb tail
  let peak = 0, clipped = 0;
  for (let i = 0; i < mono.length; i++) { const v = Math.abs(mono[i]); peak = Math.max(peak, v); if (v > 0.995) clipped++; }
  // Gated loudness (400 ms blocks, absolute gate -60 dB): an un-weighted LUFS-like number.
  const blk = Math.floor(sr * 0.4), blocks = [];
  for (let s = 0; s + blk < bodyEnd; s += blk) blocks.push(rms(mono, s, s + blk));
  const gated = blocks.filter((b) => db(b) > -60);
  const loud = db(Math.sqrt(gated.reduce((t, b) => t + b * b, 0) / Math.max(1, gated.length)));
  // Silent gaps inside the body (250 ms windows below -55 dB), skipping the first 300 ms.
  const w = Math.floor(sr * 0.25); let gaps = 0;
  for (let s = Math.floor(sr * 0.3); s + w < bodyEnd; s += w) if (db(rms(mono, s, s + w)) < -55) gaps++;
  // Loop seam: loudness just after the loop point vs just after the start of loop 2's same position elsewhere.
  const seam = Math.floor(sr * (loopSeconds + 0.05));
  const around = db(rms(mono, seam - Math.floor(sr * 0.5), seam + Math.floor(sr * 0.5)));
  const ref = db(rms(mono, Math.floor(sr * (loopSeconds * 1.5)), Math.floor(sr * (loopSeconds * 1.5 + 1))));
  const seamDelta = Math.round((around - ref) * 10) / 10;
  const b = bands(mono.subarray(0, bodyEnd), sr);
  const problems = [];
  if (clipped > 0) problems.push(`${clipped} clipped samples`);
  if (db(peak) > -0.5) problems.push(`peak ${db(peak).toFixed(1)} dBFS is too hot`);
  if (loud < -30) problems.push(`very quiet (${loud.toFixed(1)} dB)`);
  if (gaps > 0) problems.push(`${gaps} silent 250 ms gaps`);
  if (Math.abs(seamDelta) > 9) problems.push(`loop seam level jump ${seamDelta} dB`);
  return { sr, seconds: +(mono.length / sr).toFixed(1), peakDb: +db(peak).toFixed(1), loudnessDb: +loud.toFixed(1), clipped, silentGaps: gaps, seamDeltaDb: seamDelta, bands: b, problems };
}
