import React from 'react';
import { CaseSpec, generateStrip } from './waveforms';

// A motion-graphics mark drawn inside a strip's SVG, in strip coordinates:
// t in seconds along the strip, amp in mm above (or below) the baseline.
export type Mark =
  | { kind: 'ring'; t0: number; t1?: number; amp?: number; tall?: number; label?: string }
  | { kind: 'arrow'; t0: number; amp?: number; label?: string }
  | { kind: 'caliper'; t0: number; t1: number; amp?: number; label?: string }
  | { kind: 'boxes'; t0: number; count: number; label?: string }
  | { kind: 'line'; t0: number; t1: number; amp?: number; label?: string };

function MarkSvg({ m, W, H, upm, seconds }: { m: Mark; W: number; H: number; upm: number; seconds: number }) {
  const mid = H * 0.55;
  const X = (t: number) => (t / seconds) * W;
  const Y = (amp: number) => mid - amp * upm;
  const lab = (x: number, y: number, text: string) => (
    <text key="l" className="ecg-mark-label" x={x} y={y} textAnchor="middle">{text}</text>
  );
  switch (m.kind) {
    case 'ring': {
      const t1 = m.t1 ?? m.t0 + 0.28;
      const cx = (X(m.t0) + X(t1)) / 2;
      const cy = Y(m.amp ?? 0);
      const rx = Math.max(46, (X(t1) - X(m.t0)) / 2 + 34);
      const ry = (m.tall ?? 6) * upm;
      return (
        <g className="ecg-mark ecg-mark-ring">
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
          {m.label && lab(cx, cy - ry - 14, m.label)}
        </g>
      );
    }
    case 'arrow': {
      const x = X(m.t0);
      const y = Y(m.amp ?? 0);
      const down = y - 150 > 6; // enough room above the target?
      const yHead = down ? y - 2 : y + 2;
      const yTail = down ? Math.max(8, y - 150) : Math.min(H - 8, y + 150);
      const yBase = down ? yHead - 26 : yHead + 26;
      const poly = down
        ? `${x - 16},${yHead - 26} ${x + 16},${yHead - 26} ${x},${yHead}`
        : `${x - 16},${yHead + 26} ${x + 16},${yHead + 26} ${x},${yHead}`;
      return (
        <g className="ecg-mark ecg-mark-arrow">
          <line x1={x} y1={yTail} x2={x} y2={yBase} />
          <polygon points={poly} />
          {m.label && lab(x + 40, (yTail + yBase) / 2 + 6, m.label)}
        </g>
      );
    }
    case 'caliper': {
      const y = Y(m.amp ?? -6);
      return (
        <g className="ecg-mark ecg-mark-caliper">
          <line x1={X(m.t0)} y1={y} x2={X(m.t1)} y2={y} />
          <line x1={X(m.t0)} y1={y - 18} x2={X(m.t0)} y2={y + 18} />
          <line x1={X(m.t1)} y1={y - 18} x2={X(m.t1)} y2={y + 18} />
          {m.label && lab((X(m.t0) + X(m.t1)) / 2, y + 52, m.label)}
        </g>
      );
    }
    case 'boxes': {
      const out = [];
      for (let i = 0; i < m.count; i++) {
        out.push(<rect key={i} className="ecg-mark-box" style={{ animationDelay: `${i * 0.35}s` }}
          x={X(m.t0) + i * 5 * upm} y={0} width={5 * upm} height={H} />);
      }
      return (
        <g className="ecg-mark">
          {out}
          {m.label && lab(X(m.t0) + (m.count * 5 * upm) / 2, 56, m.label)}
        </g>
      );
    }
    case 'line': {
      const y = Y(m.amp ?? 0);
      return (
        <g className="ecg-mark ecg-mark-line">
          <line x1={X(m.t0)} y1={y} x2={X(m.t1)} y2={y} />
          {m.label && lab((X(m.t0) + X(m.t1)) / 2, y - 18, m.label)}
        </g>
      );
    }
  }
}

// Pure-SVG ECG strip: standard grid 1 mm minor / 5 mm major, 25 mm/s, 10 mm/mV.
// No effects or canvas, so it renders identically in static and hosted views.

// Render cache: strip math (samples, path, grid lines) is deterministic per
// (spec, lead), so compute it once and reuse it across re-renders and pages.
// This is what keeps long quiz pages smooth on phones.
interface StripRender {
  d: string;
  vMinor: number[];
  vMajor: number[];
  hMinor: number[];
  hMajor: number[];
  W: number;
  H: number;
  mid: number;
  upm: number;
  width: number;
  height: number;
}
const stripCache = new Map<string, StripRender>();

function computeStrip(spec: CaseSpec, leadIndex: number): StripRender {
  const lead = spec.leads[leadIndex];
  const seconds = spec.seconds;
  const key = JSON.stringify([spec.rhythm, spec.morph, spec.noP, spec.baseline, lead, seconds, spec.seed]);
  const hit = stripCache.get(key);
  if (hit) return hit;

  const samples = generateStrip(spec, lead, seconds, spec.seed + leadIndex * 101);

  const W = seconds * 25 * 8; // 8 svg units per mm
  const upm = 8;
  let peak = 0.7;
  for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]));
  const rangeMM = Math.max(18, Math.ceil((peak * 10 * 1.3) / 5) * 5);
  const H = rangeMM * upm;
  const mid = H * 0.55;

  const step = Math.max(1, Math.floor(samples.length / (seconds * 250)));
  let d = '';
  for (let i = 0; i < samples.length; i += 2 * step) {
    const x = (i / (samples.length - 1)) * W;
    const y = mid - samples[i] * 10 * upm;
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
  }

  const vMinor: number[] = [];
  for (let mm = 1; mm < seconds * 25; mm++) if (mm % 5 !== 0) vMinor.push(mm * upm);
  const vMajor: number[] = [];
  for (let mm = 0; mm <= seconds * 25; mm += 5) vMajor.push(mm * upm);
  const hMinor: number[] = [];
  for (let mm = 1; mm <= rangeMM; mm++) if (mm % 5 !== 0) hMinor.push(mm * upm);
  const hMajor: number[] = [];
  for (let mm = 0; mm <= rangeMM; mm += 5) hMajor.push(mm * upm);

  const PXMM = 4;
  const YGAIN = 2.6; // vertical display gain so strips stay readable on phones
  const out: StripRender = {
    d, vMinor, vMajor, hMinor, hMajor, W, H, mid, upm,
    width: seconds * 25 * PXMM,
    height: rangeMM * PXMM * YGAIN,
  };
  if (stripCache.size > 500) stripCache.clear();
  stripCache.set(key, out);
  return out;
}

export function Strip({ spec, leadIndex, marks }: { spec: CaseSpec; leadIndex: number; marks?: Mark[] }) {
  const lead = spec.leads[leadIndex];
  const { d, vMinor, vMajor, hMinor, hMajor, W, H, upm, width, height } = computeStrip(spec, leadIndex);
  return (
    <svg className="ecg-strip" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
      width={width} height={height}
      role="img" aria-label={`Simulated ECG, ${lead.label}`}>
      <rect width={W} height={H} fill="#ffffff" />
      {vMinor.map((x) => <line key={'vm' + x} x1={x} y1={0} x2={x} y2={H} stroke="#f7e3e3" strokeWidth={0.7} />)}
      {hMinor.map((y) => <line key={'hm' + y} x1={0} y1={y} x2={W} y2={y} stroke="#f7e3e3" strokeWidth={0.7} />)}
      {vMajor.map((x) => <line key={'vM' + x} x1={x} y1={0} x2={x} y2={H} stroke="#eec4c4" strokeWidth={1.4} />)}
      {hMajor.map((y) => <line key={'hM' + y} x1={0} y1={y} x2={W} y2={y} stroke="#eec4c4" strokeWidth={1.4} />)}
      <path d={d} fill="none" stroke="#251f21" strokeWidth={2.4} strokeLinejoin="round" />
      <text x={10} y={22} fontSize={18} fontWeight={600} fill="#585254" fontFamily="system-ui, sans-serif">{lead.label}</text>
      {marks && marks.map((m, i) => <MarkSvg key={i} m={m} W={W} H={H} upm={upm} seconds={spec.seconds} />)}
    </svg>
  );
}

export function EcgFigure({ spec, marksByLead }: { spec: CaseSpec; marksByLead?: Record<number, Mark[]> }) {
  const grid = spec.leads.length >= 4;
  return (
    <div className={grid ? 'ecg-fig ecg-fig--grid' : 'ecg-fig'} dir="ltr">
      {spec.leads.map((lead, i) => (
        <div key={lead.label + i} className="ecg-cell">
          <Strip spec={spec} leadIndex={i} marks={marksByLead ? marksByLead[i] : undefined} />
        </div>
      ))}
    </div>
  );
}
