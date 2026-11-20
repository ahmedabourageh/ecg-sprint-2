import React, { useMemo, useState } from 'react';
import { Callout } from '@instinct/files';
import { CaseSpec, NORMAL } from './waveforms';
import { EcgFigure, Mark } from './ECG';

export interface EcgCase {
  id: string;
  spec?: CaseSpec;         // omitted for pure theory questions
  question: string;        // Arabic question (UI)
  options: string[];
  answer: number;
  hint: string;            // "where to look" hint, Arabic + terms
  explain: string;         // explanation shown after answering
  whyNot?: string;         // why the wrong options are wrong
}

const PRAISE = ['Correct. Well done', 'Exactly right', 'Great read', 'Nailed it'];
const MISS = ['Not quite. Read why', 'Close. Check the explanation', 'Not this one, but you will get it now'];

export function CaseCard({ kase, onAnswer }: { kase: EcgCase; onAnswer: (correct: boolean) => void }) {
  const [hint, setHint] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = answered && picked === kase.answer;

  return (
    <div className="ecg-case">
      {kase.spec && <EcgFigure spec={kase.spec} />}
      <p className="ecg-question">{kase.question}</p>
      <div className="ecg-options">
        {kase.options.map((opt, i) => {
          let cls = 'ecg-opt';
          if (answered && i === kase.answer) cls += ' is-right';
          else if (answered && i === picked) cls += ' is-wrong';
          return (
            <button key={opt + i} type="button" className={cls} disabled={answered}
              onClick={() => { setPicked(i); onAnswer(i === kase.answer); }}>
              {opt}
            </button>
          );
        })}
      </div>
      {!answered && (
        <div className="ecg-hintrow">
          {hint
            ? <p className="ecg-hint">Where to look: {kase.hint}</p>
            : <button type="button" className="ecg-opt ecg-hintbtn" onClick={() => setHint(true)}>Stuck? Show me where to look</button>}
        </div>
      )}
      {answered && (
        <>
          <Callout title={correct ? PRAISE[kase.id.length % PRAISE.length] : MISS[kase.id.length % MISS.length]} tone={correct ? 'note' : 'warning'}>
            <strong>Why it is right:</strong> {kase.explain}
          </Callout>
          {kase.whyNot && (
            <p className="ecg-whynot"><strong>Why the others are wrong:</strong> {kase.whyNot}</p>
          )}
        </>
      )}
    </div>
  );
}

// Spot it: tap-the-finding drill. The student taps the wave that matters
// (delta wave, P wave, premature beat). Windows are in strip seconds and
// match the deterministic beat geometry of the generator exactly.
export interface SpotDrill {
  id: string;
  spec: CaseSpec;          // single-lead strip
  question: string;
  windows: [number, number][];
  hitNote: string;         // shown on a correct tap
  missHint: string;        // shown on a wrong tap
  revealNote: string;      // shown when the answer is revealed
  ringAmp: number;         // mm above baseline for the reveal ring
}

export function SpotCard({ drill }: { drill: SpotDrill }) {
  const [tries, setTries] = useState(0);
  const [hitAt, setHitAt] = useState<[number, number] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const done = hitAt !== null || revealed;

  const onTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (done) return;
    const svg = e.currentTarget.querySelector('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / rect.width;
    const t = frac * drill.spec.seconds;
    const win = drill.windows.find(([a, b]) => t >= a && t <= b);
    if (win) setHitAt(win);
    else {
      const n = tries + 1;
      setTries(n);
      if (n >= 3) setRevealed(true);
    }
  };

  const ring: Mark | null = hitAt
    ? { kind: 'ring', t0: hitAt[0] - 0.04, t1: hitAt[1] + 0.04, amp: drill.ringAmp, tall: 7 }
    : revealed
      ? { kind: 'ring', t0: drill.windows[0][0] - 0.04, t1: drill.windows[0][1] + 0.04, amp: drill.ringAmp, tall: 7 }
      : null;

  return (
    <div className="ecg-case">
      <p className="ecg-question">{drill.question}</p>
      <div className="ecg-spotdrill" onClick={onTap} role="button" aria-label="Tap the finding on the tracing">
        <EcgFigure spec={drill.spec} marksByLead={ring ? { 0: [ring] } : undefined} />
      </div>
      {!done && (
        <p className="ecg-order-note">
          {tries === 0 ? 'Tap right on the finding. Three tries, then I show you.' : drill.missHint + ` (${3 - tries} ${3 - tries === 1 ? 'try' : 'tries'} left)`}
        </p>
      )}
      {hitAt && (
        <Callout title="Spotted it" tone="note">{drill.hitNote}</Callout>
      )}
      {revealed && (
        <Callout title="There it is" tone="warning">{drill.revealNote}</Callout>
      )}
    </div>
  );
}

// Compare & Explain: two easily confused tracings side by side. The student taps
// the distinguishing feature on either strip; the reveal rings the giveaway on
// both and explains them next to each other. Windows are strip seconds from the
// generator's beat geometry (vent times are R-peak times).
export interface CompareTarget { lead: number; t0: number; t1: number; ringAmp: number; }
export interface CompareSide {
  name: string;          // diagnosis name revealed after the tap
  spec: CaseSpec;
  targets: CompareTarget[];
  note: string;          // what separates this tracing from its twin
}
export interface CompareDrill {
  id: string;
  title: string;
  question: string;
  missHint: string;
  a: CompareSide;
  b: CompareSide;
}

export function CompareCard({ drill }: { drill: CompareDrill }) {
  const [tries, setTries] = useState(0);
  const [hit, setHit] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const done = hit || revealed;

  const onTap = (side: 'a' | 'b') => (e: React.MouseEvent<HTMLDivElement>) => {
    if (done) return;
    const svg = (e.target as Element).closest('svg');
    if (!svg) return;
    const figs = svg.closest('.ecg-fig');
    if (!figs) return;
    const lead = [...figs.querySelectorAll('svg')].indexOf(svg);
    const rect = svg.getBoundingClientRect();
    const t = ((e.clientX - rect.left) / rect.width) * drill[side].spec.seconds;
    const win = drill[side].targets.find((w) => w.lead === lead && t >= w.t0 && t <= w.t1);
    if (win) setHit(true);
    else {
      const n = tries + 1;
      setTries(n);
      if (n >= 3) setRevealed(true);
    }
  };

  const rings = (side: CompareSide): Record<number, Mark[]> | undefined => {
    if (!done) return undefined;
    const byLead: Record<number, Mark[]> = {};
    side.targets.slice(0, 2).forEach((w) => {
      (byLead[w.lead] = byLead[w.lead] || []).push({ kind: 'ring', t0: w.t0 - 0.04, t1: w.t1 + 0.04, amp: w.ringAmp, tall: 7 });
    });
    return byLead;
  };

  return (
    <div className="ecg-case">
      <p className="ecg-question">{drill.title}</p>
      <p className="ecg-order-note">{drill.question}</p>
      <div className="ecg-compare">
        {(['a', 'b'] as const).map((side) => (
          <div key={side} className="ecg-compare-side">
            <span className="ecg-chip">{done ? drill[side].name : 'Tracing ' + side.toUpperCase()}</span>
            <div className="ecg-spotdrill" onClick={onTap(side)} role="button"
              aria-label={`Tap the distinguishing feature on tracing ${side.toUpperCase()}`}>
              <EcgFigure spec={drill[side].spec} marksByLead={rings(drill[side])} />
            </div>
          </div>
        ))}
      </div>
      {!done && (
        <p className="ecg-order-note">
          {tries === 0 ? 'Tap the giveaway on either tracing. Three tries, then both answers appear.' : drill.missHint + ` (${3 - tries} ${3 - tries === 1 ? 'try' : 'tries'} left)`}
        </p>
      )}
      {done && (
        <div className="ecg-compare">
          <Callout title={hit ? 'Spotted it - tracing A' : 'Tracing A'} tone={hit ? 'note' : 'warning'}>
            <strong>{drill.a.name}:</strong> {drill.a.note}
          </Callout>
          <Callout title={hit ? 'Spotted it - tracing B' : 'Tracing B'} tone={hit ? 'note' : 'warning'}>
            <strong>{drill.b.name}:</strong> {drill.b.note}
          </Callout>
        </div>
      )}
    </div>
  );
}

// Axis drill: two leads (I and aVF) drawn for a random frontal-plane quadrant;
// the student names the quadrant. Two-thumb rule taught on every answer.
export type AxisKind = 'normal' | 'left' | 'right' | 'extreme';

const AXIS_TABLE: {
  kind: AxisKind; label: string; deg: string;
  leadI: { rAmp: number; sAmp: number; qAmp: number };
  leadAVF: { rAmp: number; sAmp: number; qAmp: number };
  why: string;
}[] = [
  {
    kind: 'normal', label: 'Normal axis', deg: '0 to +90',
    leadI: { rAmp: 0.9, sAmp: -0.15, qAmp: -0.05 },
    leadAVF: { rAmp: 0.85, sAmp: -0.2, qAmp: -0.05 },
    why: 'Lead I is positive and aVF is positive: the main current runs down and to the left, landing between 0 and +90. That is a normal axis.',
  },
  {
    kind: 'left', label: 'Left axis deviation', deg: '0 to -90',
    leadI: { rAmp: 0.95, sAmp: -0.05, qAmp: -0.05 },
    leadAVF: { rAmp: 0.3, sAmp: -0.55, qAmp: 0 },
    why: 'Lead I is positive but aVF is negative: the current heads left and up, landing between 0 and -90. Left axis deviation: think left anterior fascicular block or LVH.',
  },
  {
    kind: 'right', label: 'Right axis deviation', deg: '+90 to +180',
    leadI: { rAmp: 0.25, sAmp: -0.6, qAmp: 0 },
    leadAVF: { rAmp: 0.9, sAmp: -0.1, qAmp: -0.05 },
    why: 'Lead I is negative and aVF is positive: the current heads down and to the right, landing between +90 and +180. Right axis deviation: think RVH or a large pulmonary embolism.',
  },
  {
    kind: 'extreme', label: 'Extreme axis', deg: '-90 to -180',
    leadI: { rAmp: 0.3, sAmp: -0.55, qAmp: 0 },
    leadAVF: { rAmp: 0.3, sAmp: -0.5, qAmp: 0 },
    why: 'Both leads are negative: the current heads up and to the right, landing between -90 and -180. Extreme axis: first check the electrodes are not swapped, then think of ventricular rhythms.',
  },
];

const AXIS_RULE = 'Two-thumb rule: one thumb for lead I, one for aVF. Up for positive, down for negative. Both up = normal. I up, aVF down = left axis. I down, aVF up = right axis. Both down = extreme.';

export function AxisDrill() {
  const [entry, setEntry] = useState(() => AXIS_TABLE[Math.floor(Math.random() * 4)]);
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<AxisKind | null>(null);
  const [score, setScore] = useState({ ok: 0, n: 0 });
  const answered = picked !== null;
  const correct = answered && picked === entry.kind;

  const spec: CaseSpec = {
    rhythm: { kind: 'regular', rate: 68 + (round % 4) * 6 },
    baseline: 'flat',
    morph: { ...NORMAL },
    leads: [
      { label: 'I', morph: entry.leadI },
      { label: 'aVF', morph: entry.leadAVF },
    ],
    seconds: 4,
    seed: 41 + round,
  };

  const next = () => {
    let e = AXIS_TABLE[Math.floor(Math.random() * 4)];
    if (e.kind === entry.kind) e = AXIS_TABLE[(AXIS_TABLE.indexOf(e) + 1) % 4];
    setEntry(e);
    setRound((r) => r + 1);
    setPicked(null);
  };

  return (
    <div className="ecg-case">
      <div className="ecg-exambar">
        <span className="ecg-chip">Round {round + 1}</span>
        <span className="ecg-chip">{score.ok} / {score.n} correct</span>
      </div>
      <EcgFigure spec={spec} />
      <p className="ecg-question">Which quadrant is the frontal-plane axis in?</p>
      <div className="ecg-options">
        {AXIS_TABLE.map((opt) => {
          let cls = 'ecg-opt';
          if (answered && opt.kind === entry.kind) cls += ' is-right';
          else if (answered && opt.kind === picked) cls += ' is-wrong';
          return (
            <button key={opt.kind} type="button" className={cls} disabled={answered}
              onClick={() => { setPicked(opt.kind); setScore((s) => ({ ok: s.ok + (opt.kind === entry.kind ? 1 : 0), n: s.n + 1 })); }}>
              {opt.label} ({opt.deg})
            </button>
          );
        })}
      </div>
      {answered && (
        <>
          <Callout title={correct ? PRAISE[round % PRAISE.length] : MISS[round % MISS.length]} tone={correct ? 'note' : 'warning'}>
            <strong>Read the two leads:</strong> {entry.why}
          </Callout>
          <p className="ecg-whynot"><strong>Keep the rule:</strong> {AXIS_RULE}</p>
          <div className="ecg-hintrow">
            <button type="button" className="ecg-opt ecg-hintbtn" onClick={next}>Next axis</button>
          </div>
        </>
      )}
    </div>
  );
}

// Rate drill: name the ventricular rate of a fresh strip. Teaches the 300 rule.
const RATE_PICKS: { kind: CaseSpec['rhythm']['kind']; rate: number; note?: string }[] = [
  { kind: 'regular', rate: 48 },
  { kind: 'regular', rate: 60 },
  { kind: 'regular', rate: 75 },
  { kind: 'regular', rate: 96 },
  { kind: 'regular', rate: 120 },
  { kind: 'regular', rate: 150 },
  { kind: 'af', rate: 110, note: 'Irregular rhythm: count the QRS complexes in the strip and scale up.' },
  { kind: 'psvt', rate: 190 },
  { kind: 'vt', rate: 170 },
];

const RATE_RULE = 'The 300 rule: count the large boxes between two R waves. 300 / boxes = rate. One box is 300, two is 150, three is 100, four is 75, five is 60, six is 50. Below that, count QRS complexes in 6 seconds and multiply by ten.';

export function RateDrill() {
  const [entry, setEntry] = useState(() => RATE_PICKS[Math.floor(Math.random() * RATE_PICKS.length)]);
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ ok: 0, n: 0 });
  const answered = picked !== null;
  const correct = answered && picked === entry.rate;

  const options = useMemo(() => {
    const set = new Set<number>([entry.rate]);
    const pool = RATE_PICKS.map((r) => r.rate).filter((r) => r !== entry.rate);
    let i = Math.floor(Math.random() * pool.length);
    while (set.size < 4 && pool.length) {
      set.add(pool[i % pool.length]);
      pool.splice(i % pool.length, 1);
      i++;
    }
    return [...set].sort(() => Math.random() - 0.5);
  }, [entry]);

  const spec: CaseSpec = {
    rhythm: { kind: entry.kind, rate: entry.rate },
    baseline: 'flat',
    morph: { ...NORMAL },
    leads: [{ label: 'Lead II' }],
    seconds: 5,
    seed: 61 + round,
  };

  const next = () => {
    let e = RATE_PICKS[Math.floor(Math.random() * RATE_PICKS.length)];
    if (e === entry) e = RATE_PICKS[(RATE_PICKS.indexOf(e) + 1) % RATE_PICKS.length];
    setEntry(e);
    setRound((r) => r + 1);
    setPicked(null);
  };

  return (
    <div className="ecg-case">
      <div className="ecg-exambar">
        <span className="ecg-chip">Round {round + 1}</span>
        <span className="ecg-chip">{score.ok} / {score.n} correct</span>
      </div>
      <EcgFigure spec={spec} />
      <p className="ecg-question">What is the ventricular rate, in beats per minute?</p>
      <div className="ecg-options">
        {options.map((opt) => {
          let cls = 'ecg-opt';
          if (answered && opt === entry.rate) cls += ' is-right';
          else if (answered && opt === picked) cls += ' is-wrong';
          return (
            <button key={opt} type="button" className={cls} disabled={answered}
              onClick={() => { setPicked(opt); setScore((s) => ({ ok: s.ok + (opt === entry.rate ? 1 : 0), n: s.n + 1 })); }}>
              {opt} bpm
            </button>
          );
        })}
      </div>
      {answered && (
        <>
          <Callout title={correct ? PRAISE[round % PRAISE.length] : MISS[round % MISS.length]} tone={correct ? 'note' : 'warning'}>
            <strong>The rate is {entry.rate} bpm.</strong> {entry.note ? entry.note + ' ' : ''}{RATE_RULE}
          </Callout>
          <div className="ecg-hintrow">
            <button type="button" className="ecg-opt ecg-hintbtn" onClick={next}>Next strip</button>
          </div>
        </>
      )}
    </div>
  );
}

// Interval drill: judge the PR interval or the QRS width on a fresh strip.
const INTERVAL_PICKS: {
  ask: 'pr' | 'qrs'; morph: Record<string, number | boolean>;
  options: string[]; answer: number; explain: string;
}[] = [
  {
    ask: 'pr', morph: {},
    options: ['Normal (0.12-0.20 s)', 'Prolonged (over 0.20 s)', 'Short (under 0.12 s)'], answer: 0,
    explain: 'The PR here is about 0.16 s, inside the normal 0.12 to 0.20 window, three to five small boxes.',
  },
  {
    ask: 'pr', morph: { pr: 0.28 },
    options: ['Normal (0.12-0.20 s)', 'Prolonged (over 0.20 s)', 'Short (under 0.12 s)'], answer: 1,
    explain: 'The PR here is 0.28 s, beyond the one-big-box limit, but every P still reaches the ventricles: first degree AV block.',
  },
  {
    ask: 'pr', morph: { pr: 0.1, delta: 0.3, qrsW: 1.35 },
    options: ['Normal (0.12-0.20 s)', 'Prolonged (over 0.20 s)', 'Short (under 0.12 s)'], answer: 2,
    explain: 'The PR is about 0.10 s, under three small boxes, and the QRS starts with a slur: pre-excitation. Short PR plus delta wave is WPW.',
  },
  {
    ask: 'qrs', morph: {},
    options: ['Narrow (under 0.12 s)', 'Wide (0.12 s or more)'], answer: 0,
    explain: 'The QRS is under three small boxes: narrow. The impulse used the normal His-Purkinje system, so it came from above the ventricles.',
  },
  {
    ask: 'qrs', morph: { qrsW: 2.6, rAmp: 1.3, sAmp: -0.5, tInvert: true, tAmp: 0.3 },
    options: ['Narrow (under 0.12 s)', 'Wide (0.12 s or more)'], answer: 1,
    explain: 'The QRS sprawls well past three small boxes with a discordant T: wide. Either a ventricular origin or a blocked bundle; treat a wide fast rhythm as VT until proven otherwise.',
  },
  {
    ask: 'qrs', morph: { qrsW: 1.4, r2Amp: 0.8 },
    options: ['Narrow (under 0.12 s)', 'Wide (0.12 s or more)'], answer: 1,
    explain: 'The second R wave (R prime) stretches the QRS past 0.12 s: wide, the rsR pattern of a right bundle branch block.',
  },
];

const INTERVAL_RULE = 'Anchor numbers: PR runs 0.12 to 0.20 s, three to five small boxes. QRS under 0.12 s, three small boxes, is narrow. One small box is 0.04 s, one big box is 0.20 s.';

export function IntervalDrill() {
  const [entry, setEntry] = useState(() => INTERVAL_PICKS[Math.floor(Math.random() * INTERVAL_PICKS.length)]);
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ ok: 0, n: 0 });
  const answered = picked !== null;
  const correct = answered && picked === entry.answer;

  const spec: CaseSpec = {
    rhythm: { kind: 'regular', rate: 70 + (round % 3) * 8 },
    baseline: 'flat',
    morph: { ...NORMAL },
    leads: [{ label: 'Lead II', morph: entry.morph }],
    seconds: 4,
    seed: 131 + round,
  };

  const next = () => {
    let e = INTERVAL_PICKS[Math.floor(Math.random() * INTERVAL_PICKS.length)];
    if (e === entry) e = INTERVAL_PICKS[(INTERVAL_PICKS.indexOf(e) + 1) % INTERVAL_PICKS.length];
    setEntry(e);
    setRound((r) => r + 1);
    setPicked(null);
  };

  return (
    <div className="ecg-case">
      <div className="ecg-exambar">
        <span className="ecg-chip">Round {round + 1}</span>
        <span className="ecg-chip">{score.ok} / {score.n} correct</span>
      </div>
      <EcgFigure spec={spec} />
      <p className="ecg-question">{entry.ask === 'pr' ? 'Judge the PR interval on this strip.' : 'Judge the QRS width on this strip.'}</p>
      <div className="ecg-options">
        {entry.options.map((opt, i) => {
          let cls = 'ecg-opt';
          if (answered && i === entry.answer) cls += ' is-right';
          else if (answered && i === picked) cls += ' is-wrong';
          return (
            <button key={opt} type="button" className={cls} disabled={answered}
              onClick={() => { setPicked(i); setScore((s) => ({ ok: s.ok + (i === entry.answer ? 1 : 0), n: s.n + 1 })); }}>
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <>
          <Callout title={correct ? PRAISE[round % PRAISE.length] : MISS[round % MISS.length]} tone={correct ? 'note' : 'warning'}>
            <strong>Measure it:</strong> {entry.explain}
          </Callout>
          <p className="ecg-whynot"><strong>Anchor numbers:</strong> {INTERVAL_RULE}</p>
          <div className="ecg-hintrow">
            <button type="button" className="ecg-opt ecg-hintbtn" onClick={next}>Next strip</button>
          </div>
        </>
      )}
    </div>
  );
}

// Order-the-steps question: tap the steps in the correct sequence.
export function OrderQuiz({ id, question, steps, onAnswer }: {
  id: string;
  question: string;
  steps: string[]; // in correct order
  onAnswer: (correct: boolean) => void;
}) {
  const [shuffled] = useState(() => {
    const idx = steps.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = (id.length * 7 + i * 13) % (i + 1);
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  });
  const [pickedSeq, setPickedSeq] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const correct = done && pickedSeq.every((v, i) => v === i);

  const pick = (origIdx: number) => {
    if (done) return;
    const seq = [...pickedSeq, origIdx];
    setPickedSeq(seq);
    if (seq.length === steps.length) {
      setDone(true);
      onAnswer(seq.every((v, i) => v === i));
    }
  };

  return (
    <div className="ecg-case">
      <p className="ecg-question">{question}</p>
      <p className="ecg-order-note">Tap the steps in the correct order.</p>
      <div className="ecg-options">
        {shuffled.map((origIdx) => {
          const pos = pickedSeq.indexOf(origIdx);
          let cls = 'ecg-opt ecg-order';
          if (pos !== -1) cls += ' is-picked';
          if (done && pos !== -1 && origIdx !== pos) cls += ' is-wrong';
          if (done && pos !== -1 && origIdx === pos) cls += ' is-right';
          return (
            <button key={origIdx} type="button" className={cls} disabled={done || pos !== -1}
              onClick={() => pick(origIdx)}>
              {pos !== -1 && <span className="ecg-order-num">{pos + 1}</span>}
              {steps[origIdx]}
            </button>
          );
        })}
      </div>
      {done && (
        <Callout title={correct ? 'Correct order. Well done' : 'Here is the correct order'} tone={correct ? 'note' : 'warning'}>
          {correct
            ? 'This is the order you will read every ECG with, so nothing gets missed.'
            : 'Correct order: ' + steps.map((s, i) => `${i + 1}. ${s}`).join(' - ')}
        </Callout>
      )}
    </div>
  );
}
