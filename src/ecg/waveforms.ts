// Deterministic synthetic ECG generator v2. 25 mm/s, 10 mm/mV.
// Morphology constants follow standard teaching values (Dubin; AHA/ACCF/HRS
// standardization; Learn ECG in a Day, Sajjan M). Simulated teaching traces,
// not patient data.

export interface Morph {
  pAmp: number;   // mV
  pSig: number;   // s
  pr: number;     // s, P start to QRS start
  pInvert: boolean; // retrograde / ectopic atrial P
  pNotch: boolean;  // P mitrale: second hump
  qAmp: number;
  rAmp: number;
  r2Amp: number;  // R' for rsR'
  sAmp: number;
  qrsW: number;   // width scale, 1 = normal (~90 ms)
  delta: number;  // WPW slurred upstroke amount (mV)
  st: number;     // mV offset, + elevation / - depression
  stConcave: boolean; // BER style concave elevation
  tAmp: number;
  tSig: number;   // s
  tInvert: boolean;
  qtScale: number;
}

export type RhythmKind =
  | 'regular' | 'sinarr' | 'af' | 'psvt'
  | 'mobitz1' | 'mobitz2' | 'avd'
  | 'junc' | 'iv' | 'vt' | 'vf' | 'torsades'
  | 'pvc2' | 'pvc3' | 'pac' | 'pause';

export interface Rhythm {
  kind: RhythmKind;
  rate: number;        // ventricular bpm
  atrialRate?: number; // for avd / flutter / af
}

export interface StripSpec {
  label: string;
  morph?: Partial<Morph>;
  seconds?: number;
}

export interface CaseSpec {
  rhythm: Rhythm;
  baseline: 'flat' | 'fib' | 'sawtooth' | 'vf';
  noP?: boolean;
  morph: Morph;
  leads: StripSpec[];
  seconds: number;
  seed: number;
}

export const NORMAL: Morph = {
  pAmp: 0.12, pSig: 0.028, pr: 0.16, pInvert: false, pNotch: false,
  qAmp: -0.06, rAmp: 1.0, r2Amp: 0, sAmp: -0.15, qrsW: 1,
  delta: 0, st: 0, stConcave: false, tAmp: 0.22, tSig: 0.05, tInvert: false,
  qtScale: 1,
};

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const g = (u: number, mu: number, sig: number) => Math.exp(-((u - mu) * (u - mu)) / (2 * sig * sig));

function smooth(x: number) { return x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x); }

function plateau(u: number, a: number, b: number, c: number, d: number) {
  return smooth((u - a) / (b - a)) * (1 - smooth((u - c) / (d - c)));
}

// u = seconds relative to R peak. sc = repolarization scaling with RR.
function vcomplex(u: number, m: Morph, sc: number): number {
  const w = m.qrsW;
  let v = 0;
  v += m.qAmp * g(u, -0.032 * w, 0.009 * w);
  if (m.delta) v += m.delta * plateau(u, -0.07 * w, -0.045 * w, -0.015 * w, -0.005 * w);
  v += m.rAmp * g(u, 0, 0.011 * w);
  if (m.r2Amp) v += m.r2Amp * g(u, 0.042 * w, 0.011 * w);
  v += m.sAmp * g(u, (m.r2Amp ? 0.082 : 0.034) * w, 0.011 * w);
  const qt = 0.34 * sc * m.qtScale; // R peak to T peak
  const s0 = (m.r2Amp ? 0.10 : 0.05) * w;
  const s1 = s0 + 0.05;
  const t0 = Math.max(s1 + 0.02, qt - 0.10);
  const t1 = t0 + 0.05;
  v += m.st * plateau(u, s0, s1, t0, t1);
  if (m.stConcave) v += m.st * 0.4 * g(u, s0 + 0.02, 0.03);
  v += (m.tInvert ? -1 : 1) * m.tAmp * g(u, qt, m.tSig * sc);
  return v;
}

export function generateStrip(spec: CaseSpec, lead: StripSpec, seconds: number, seed: number): Float32Array {
  const fs = 250;
  const n = Math.round(seconds * fs);
  const out = new Float32Array(n);
  const rnd = mulberry32(seed);
  const m: Morph = { ...spec.morph, ...(lead.morph || {}) };
  const RR = 60 / spec.rhythm.rate;
  const sc = Math.min(1.4, Math.max(0.55, Math.sqrt(RR / 0.8)));
  const kind = spec.rhythm.kind;

  if (kind === 'vf') {
    for (let i = 0; i < n; i++) {
      const t = i / fs;
      let v = 0;
      v += 0.28 * Math.sin(2 * Math.PI * (3.1 + 1.2 * Math.sin(2 * Math.PI * 0.23 * t)) * t + 6 * rnd());
      v += 0.2 * Math.sin(2 * Math.PI * 5.7 * t + 12 * rnd());
      v += 0.12 * Math.sin(2 * Math.PI * 8.3 * t + 9 * rnd());
      out[i] = v;
    }
    return out;
  }

  // Atrial events (P times). Flutter/fib handled as baseline instead.
  const atrial: number[] = [];
  if (!spec.noP && spec.baseline === 'flat') {
    const aRR = 60 / (spec.rhythm.atrialRate ?? spec.rhythm.rate);
    for (let t = 0.06; t < seconds + 0.5; t += aRR) atrial.push(t);
  }

  // Ventricular events: pairs of [tR, morph override or null]
  const vents: Array<[number, Partial<Morph> | null]> = [];
  const pr = m.pr;
  const pvcMorph: Partial<Morph> = { qrsW: 2.6, rAmp: 1.4, sAmp: -0.6, tInvert: true, tAmp: 0.35 };

  if (kind === 'regular' || kind === 'psvt' || kind === 'vt' || kind === 'iv') {
    if (atrial.length) {
      for (const tp of atrial) {
        const tR = tp + pr + 0.06;
        if (tR < seconds + 0.3) vents.push([tR, null]);
      }
    } else {
      for (let t = 0.12; t < seconds + 0.3; t += RR) vents.push([t, null]);
    }
  } else if (kind === 'junc') {
    // Narrow QRS escape; retrograde P just before the QRS if not hidden.
    for (let t = 0.2; t < seconds + 0.3; t += RR) vents.push([t, null]);
    if (!spec.noP) for (const [t] of vents) atrial.push(t - 0.12);
  } else if (kind === 'sinarr') {
    let tp = 0.06;
    while (tp < seconds + 0.5) {
      atrial.push(tp);
      const tR = tp + pr + 0.06;
      if (tR < seconds + 0.3) vents.push([tR, null]);
      tp += RR * (0.82 + 0.36 * (0.5 + 0.5 * Math.sin(2 * Math.PI * tp / (4 * RR))));
    }
  } else if (kind === 'af') {
    let t = 0.15;
    while (t < seconds + 0.3) { vents.push([t, null]); t += RR * (0.6 + 0.8 * rnd()); }
  } else if (kind === 'torsades') {
    const per = 2.2; // seconds per twist
    let t = 0.15;
    while (t < seconds + 0.3) {
      const env = Math.sin(2 * Math.PI * t / per);
      const amp = Math.max(0.25, Math.abs(env));
      const pol = env >= 0 ? 1 : -1;
      vents.push([t, { qrsW: 1.9, rAmp: pol * 1.3 * amp, sAmp: pol * -0.5 * amp, qAmp: 0, tAmp: 0.25 * amp, tInvert: pol < 0 }]);
      t += RR * (0.9 + 0.2 * rnd());
    }
  } else if (kind === 'mobitz1') {
    for (let i = 0; i < atrial.length; i++) {
      const k = i % 3;
      if (k === 2) continue;
      const prK = k === 0 ? 0.22 : 0.34;
      const tR = atrial[i] + prK + 0.06;
      if (tR < seconds + 0.3) vents.push([tR, null]);
    }
  } else if (kind === 'mobitz2') {
    for (let i = 0; i < atrial.length; i++) {
      if (i % 3 === 2) continue;
      const tR = atrial[i] + pr + 0.06;
      if (tR < seconds + 0.3) vents.push([tR, null]);
    }
  } else if (kind === 'avd') {
    const esc = 60 / spec.rhythm.rate;
    for (let t = 0.3; t < seconds + 0.3; t += esc) vents.push([t, null]);
  } else if (kind === 'pvc2' || kind === 'pvc3') {
    // bigeminy (pvc2) or trigeminy (pvc3): premature wide beat every Nth cycle
    const every = kind === 'pvc2' ? 2 : 3;
    let tp = 0.06;
    let beat = 0;
    while (tp < seconds + 0.5) {
      atrial.push(tp);
      beat++;
      const tR = tp + pr + 0.06;
      if (beat % every === 0) {
        // premature ventricular beat instead of the conducted one
        const tE = tR - RR * 0.35;
        if (tE < seconds + 0.3) vents.push([tE, pvcMorph]);
        tp += RR * 1.5; // compensatory pause
      } else {
        if (tR < seconds + 0.3) vents.push([tR, null]);
        tp += RR;
      }
    }
  } else if (kind === 'pac') {
    // every 4th atrial beat early, abnormal P, narrow QRS, then pause
    let tp = 0.06;
    let beat = 0;
    while (tp < seconds + 0.5) {
      beat++;
      const early = beat % 4 === 0;
      atrial.push(tp);
      const tR = tp + (early ? Math.max(0.12, pr - 0.02) : pr) + 0.06;
      if (tR < seconds + 0.3) vents.push([tR, early ? { pAmp: 0.16 } : null]);
      tp += early ? RR * 1.3 : (beat % 4 === 3 ? RR * 0.75 : RR);
    }
  } else if (kind === 'pause') {
    // sinus pause: one whole cycle missing
    let tp = 0.06;
    let i = 0;
    while (tp < seconds + 0.5) {
      i++;
      atrial.push(tp);
      const tR = tp + pr + 0.06;
      if (tR < seconds + 0.3) vents.push([tR, null]);
      tp += i === 2 ? RR * 2.1 : RR;
    }
  }

  for (let i = 0; i < n; i++) {
    const t = i / fs;
    let v = 0;
    if (spec.baseline === 'sawtooth') {
      const f = (spec.rhythm.atrialRate ?? 300) / 60;
      const ph = (t * f) % 1;
      v += 0.22 * (ph < 0.7 ? ph / 0.7 : 1 - (ph - 0.7) / 0.3) - 0.16;
    } else if (spec.baseline === 'fib') {
      v += 0.045 * Math.sin(2 * Math.PI * 6.3 * t + 2 * rnd()) + 0.03 * Math.sin(2 * Math.PI * 4.1 * t + 6 * rnd());
    }
    if (spec.baseline === 'flat') {
      for (const tp of atrial) {
        const amp = m.pInvert ? -m.pAmp : m.pAmp;
        v += amp * g(t, tp + m.pSig + 0.03, m.pSig);
        if (m.pNotch) v += amp * 0.85 * g(t, tp + 0.13, m.pSig);
      }
    }
    for (const [tv, over] of vents) {
      const mm: Morph = over ? { ...m, ...over } : m;
      v += vcomplex(t - tv, mm, sc);
    }
    v += 0.006 * (rnd() - 0.5);
    out[i] = v;
  }
  return out;
}
