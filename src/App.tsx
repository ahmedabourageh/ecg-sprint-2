import React, { useEffect, useMemo, useState } from 'react';
import { Callout, Closing, Facts, FileCard, Group, Header, Link, NavLink, Paragraph, Route, Routes, Row, Rows, Text } from '@instinct/files';
import { useLocalState } from '@instinct/files';
import { modules } from './ecg/modules';
import { ModuleDef } from './ecg/content';
import { Explainer, ExplainAudio } from './ecg/Explainer';
import { choreo } from './ecg/choreo';
import { loadAudio } from './ecg/audio';
import { CaseCard, OrderQuiz, EcgCase, SpotCard, SpotDrill, CompareCard, CompareDrill, AxisDrill, RateDrill, IntervalDrill } from './ecg/Quiz';
import { M, leadII } from './ecg/content';
import { DrBeat } from './ecg/DrNabdh';

// Animated conduction schematic: a pulse travels SA node, AV node, His,
// bundle branches, Purkinje. SMIL keeps it deterministic and effect-free.
function ConductionSchematic() {
  return (
    <div className="ecg-schematic" dir="ltr">
      <svg viewBox="0 0 320 240" width="100%" role="img" aria-label="Animation of the cardiac conduction pathway">
        <path d="M160 30 C110 20 70 60 75 110 C80 165 120 205 160 215 C200 205 240 165 245 110 C250 60 210 20 160 30 Z"
          fill="#fdf3f1" stroke="#eec4c4" strokeWidth={2.5} />
        <path d="M160 45 L160 78" stroke="#eae9ea" strokeWidth={2} />
        <circle cx={205} cy={60} r={9} fill="#73a89a" />
        <text x={228} y={64} fontSize={13} fill="#585254" fontFamily="system-ui, sans-serif">SA node</text>
        <circle cx={160} cy={95} r={8} fill="#73a89a" opacity={0.85} />
        <text x={178} y={99} fontSize={13} fill="#585254" fontFamily="system-ui, sans-serif">AV node</text>
        <path d="M160 103 L160 150 M160 150 L110 190 M160 150 L210 190" stroke="#73a89a" strokeWidth={2.5} fill="none" opacity={0.7} />
        <text x={175} y={145} fontSize={13} fill="#585254" fontFamily="system-ui, sans-serif">His</text>
        <text x={72} y={205} fontSize={13} fill="#585254" fontFamily="system-ui, sans-serif">Purkinje</text>
        <path id="ecg-pulse-path" d="M205 60 C185 68 168 80 160 95 L160 150 M160 150 L110 190 M160 150 L210 190" fill="none" stroke="none" />
        <circle r={6} fill="#ed313e">
          <animateMotion dur="2.2s" repeatCount="indefinite" path="M205 60 C185 68 168 80 160 95 L160 150" />
        </circle>
        <circle r={5} fill="#ed313e" opacity={0.8}>
          <animateMotion dur="1.1s" begin="1.6s" repeatCount="indefinite" path="M160 150 L110 190" />
        </circle>
        <circle r={5} fill="#ed313e" opacity={0.8}>
          <animateMotion dur="1.1s" begin="1.6s" repeatCount="indefinite" path="M160 150 L210 190" />
        </circle>
      </svg>
      <p className="ecg-schematic-cap">The spark travels from the SA node, pauses at the AV node, then spreads through the ventricles.</p>
    </div>
  );
}

function ModulePage({ mod, solved, onResult }: { mod: ModuleDef; solved: Record<string, boolean>; onResult: (id: string, correct: boolean) => void }) {
  const [orderSolved, setOrderSolved] = useState(false);
  const [audio, setAudio] = useState<ExplainAudio | undefined>(undefined);
  useEffect(() => {
    let live = true;
    setAudio(undefined);
    loadAudio(mod.id).then((a) => { if (live) setAudio(a); }).catch(() => {});
    return () => { live = false; };
  }, [mod.id]);
  const cases = mod.cases ?? [];
  const doneCount = cases.filter((c) => solved[c.id]).length + (orderSolved ? 1 : 0);
  const total = cases.length + (mod.orderQuiz ? 1 : 0);
  const finished = total > 0 && doneCount >= total;

  return (
    <>
      <Group label={`Module ${mod.num} - ${mod.chapters}`} heading={mod.title}>
        <Text><Paragraph>{mod.tagline}</Paragraph></Text>
      </Group>

      {mod.explainerSpec && mod.explainerSteps && (
        <Group label="Animated explanation" heading>
          <Explainer spec={mod.explainerSpec} steps={mod.explainerSteps} audio={audio} choreo={choreo[mod.id]} />
          {mod.id === 'foundations' && <ConductionSchematic />}
        </Group>
      )}

      {mod.teach && (
        <Group label="Study points" heading>
          {mod.teach.map((card) => (
            <div key={card.title} className="ecg-teachcard">
              <p className="ecg-teachtitle">{card.title}</p>
              <ul className="ecg-teachlist">
                {card.points.map((p) => <li key={p.slice(0, 24)}>{p}</li>)}
              </ul>
            </div>
          ))}
        </Group>
      )}

      {mod.clinical && (
        <Group label="Clinical layer" heading>
          <Facts items={[
            { label: 'Symptoms', value: mod.clinical.symptoms },
            { label: 'The picture to remember', value: mod.clinical.visual },
            { label: 'Treatment in brief', value: mod.clinical.treatment },
          ]} />
        </Group>
      )}

      {total > 0 && (
        <Group label={`Practice - ${doneCount} of ${total} done`} heading>
          {cases.map((kase) => (
            <CaseCard key={kase.id} kase={kase} onAnswer={(correct) => onResult(kase.id, correct)} />
          ))}
          {mod.orderQuiz && (
            <OrderQuiz id={mod.id + '-order'} question={mod.orderQuiz.question} steps={mod.orderQuiz.steps}
              onAnswer={(correct) => { if (correct) setOrderSolved(true); }} />
          )}
          {finished && (
            <Callout title="Module complete" tone="note">Every case solved. Cheat sheet below, then on to the next module.</Callout>
          )}
        </Group>
      )}

      {mod.cheat && (
        <Group label="Module cheat sheet" heading>
          <Facts items={mod.cheat} />
        </Group>
      )}

      <div className="ecg-modnav">
        {mod.num > 1 && (
          <Link className="file-button is-compact" data-variant="secondary" to={`/m/${modules[mod.num - 2].id}`}>
            &larr; Module {mod.num - 1}
          </Link>
        )}
        <Link className="file-button is-compact" data-variant="secondary" to="/">Module map</Link>
        {mod.num < 12 && (
          <Link className="file-button is-compact" data-variant="secondary" to={`/m/${modules[mod.num].id}`}>
            Module {mod.num + 1} &rarr;
          </Link>
        )}
      </div>
    </>
  );
}


// Every case across all modules, with its module title for context.
const ALL_CASES: { kase: EcgCase; modTitle: string }[] =
  modules.flatMap((m) => (m.cases ?? []).map((kase) => ({ kase, modTitle: m.title })));

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed || 1;
  const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const fmtClock = (sec: number) => Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');

// Fix my misses: every case ever answered wrong lands here until it is answered right.
// The list is frozen at mount so a just-solved card stays on screen with its explanation.
function MissesPage({ missed, onResult }: { missed: string[]; onResult: (id: string, correct: boolean) => void }) {
  const [frozen] = useState(missed);
  const picks = ALL_CASES.filter((p) => frozen.includes(p.kase.id));
  return (
    <>
      <Group label="Fix my misses" heading={`${missed.length} open`}>
        {picks.length === 0 ? (
          <Callout title="Nothing to fix" tone="note">
            No open misses. Every case you answer wrong anywhere in the app lands here automatically,
            and leaves once you answer it right.
          </Callout>
        ) : (
          <>
            <Text><Paragraph>
              These are the cases that caught you. Read the explanation, answer again, and they clear.
              The list refreshes when you come back.
            </Paragraph></Text>
            {picks.map((p) => (
              <CaseCard key={p.kase.id} kase={p.kase} onAnswer={(c) => onResult(p.kase.id, c)} />
            ))}
          </>
        )}
      </Group>
      <div className="ecg-modnav">
        <Link className="file-button is-compact" data-variant="secondary" to="/">Module map</Link>
        <Link className="file-button is-compact" data-variant="secondary" to="/exam">Mock exam</Link>
      </div>
    </>
  );
}

// Sprint: 60 seconds, as many strip reads as you can. Correct answers advance fast,
// wrong ones linger a moment so the right answer registers. Speed is the skill here.
function SprintPage({ onResult }: { onResult: (id: string, correct: boolean) => void }) {
  const [seed, setSeed] = useState<number | null>(null);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [finished, setFinished] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const picks = useMemo(
    () => (seed === null ? [] : seededShuffle(ALL_CASES.filter((p) => p.kase.spec), seed)),
    [seed],
  );

  useEffect(() => {
    if (seed === null || finished) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) { clearInterval(t); setFinished(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [seed, finished]);

  if (seed === null) {
    return (
      <>
        <Group label="Sprint" heading="Sixty seconds. Go.">
          <Text><Paragraph>
            Rapid-fire strip reading: one tracing at a time, answer, next. Correct answers fly by,
            wrong ones pause a beat so the right read sticks. Build a streak, beat your count.
            This is the drill that makes the real exam feel slow.
          </Paragraph></Text>
          <button type="button" className="ecg-opt ecg-play" onClick={() => { setSeed(Date.now() % 2147483647); setTimeLeft(60); }}>
            Start the sprint
          </button>
        </Group>
        <div className="ecg-modnav">
          <Link className="file-button is-compact" data-variant="secondary" to="/">Module map</Link>
        </div>
      </>
    );
  }

  const score = results.filter(Boolean).length;

  if (finished) {
    const verdict = score >= 12 ? 'Machine pace. That is a consultant eye.'
      : score >= 8 ? 'Fast and accurate. Exam morning will feel easy.'
      : score >= 5 ? 'Good rhythm. One more sprint and the pace climbs.'
      : 'Speed comes from reps. Run it again.';
    return (
      <>
        <Group label="Sprint - result" heading={`${score} correct in 60 seconds`}>
          <Callout title={verdict} tone={score >= 8 ? 'note' : 'warning'}>
            Attempted {results.length}, correct {score}, best streak {bestStreak} in a row.
            Anything you missed is waiting in Fix my misses.
          </Callout>
        </Group>
        <div className="ecg-modnav">
          <button type="button" className="ecg-opt ecg-play" onClick={() => {
            setSeed(null); setIdx(0); setResults([]); setStreak(0); setBestStreak(0); setFinished(false); setAdvancing(false);
          }}>
            Sprint again
          </button>
          <Link className="file-button is-compact" data-variant="secondary" to="/misses">Fix my misses</Link>
          <Link className="file-button is-compact" data-variant="secondary" to="/">Module map</Link>
        </div>
      </>
    );
  }

  const cur = picks[idx % picks.length];
  return (
    <>
      <Group label="Sprint" heading>
        <div className="ecg-exambar">
          <span className="ecg-chip" style={timeLeft <= 10 ? { color: '#fff', background: '#b3261e' } : undefined}>
            {fmtClock(timeLeft)}
          </span>
          <span className="ecg-chip">Correct {score}</span>
          <span className="ecg-chip">Streak {streak}</span>
        </div>
        {cur && (
          <CaseCard
            key={cur.kase.id + '-' + idx}
            kase={cur.kase}
            onAnswer={(correct) => {
              if (advancing) return;
              setAdvancing(true);
              onResult(cur.kase.id, correct);
              setResults((r) => [...r, correct]);
              const ns = correct ? streak + 1 : 0;
              setStreak(ns);
              if (ns > bestStreak) setBestStreak(ns);
              setTimeout(() => {
                setAdvancing(false);
                setIdx((i) => i + 1);
              }, correct ? 900 : 1700);
            }}
          />
        )}
      </Group>
    </>
  );
}

// Exam eve command center: one page for the night before the exam. A live
// plan that sequences the tools already in the app, the readiness numbers,
// and every module's cheat sheet collected for one final scroll.
function TonightPage({ solved, missed }: { solved: Record<string, boolean>; missed: string[] }) {
  const totalCases = modules.reduce((n, m) => n + (m.cases?.length ?? 0), 0);
  const solvedCount = Object.keys(solved).length;
  const doneModules = modules.filter((m) => {
    const cs = m.cases ?? [];
    return cs.length > 0 && cs.every((c) => solved[c.id]);
  }).length;
  const steps: { n: string; what: string; why: string; to: string; label: string }[] = [
    {
      n: '1', what: `Fix my misses (${missed.length} open)`,
      why: missed.length === 0
        ? 'Nothing open. Weak spots are already cleared.'
        : 'These are your personal weak spots. Each one you clear tonight is a mark saved tomorrow.',
      to: '/misses', label: missed.length > 0 ? 'Clear them now' : 'Review anyway',
    },
    {
      n: '2', what: 'Flashcards, one pass',
      why: 'Active recall on every cheat-sheet line from all twelve modules. Say the answer out loud before you flip.',
      to: '/flashcards', label: 'Shuffle and start',
    },
    {
      n: '3', what: 'One 60-second sprint',
      why: 'Wakes up pattern recognition and calibrates pace. One run is enough tonight.',
      to: '/sprint', label: 'Start the sprint',
    },
    {
      n: '4', what: 'Mock exam, under time',
      why: 'Ten cases, ten minutes, no hints of context. Simulates the real pressure once, so tomorrow feels familiar.',
      to: '/exam', label: 'Take the mock',
    },
    {
      n: '5', what: 'Master cheat sheet, one slow scroll',
      why: 'The full final scroll is below on this page. Read it last, when nothing new is coming in after it.',
      to: '', label: 'Scroll down',
    },
    {
      n: '6', what: 'Sleep',
      why: 'Memory consolidates in sleep, not in a 3 AM panic re-read. Stop at a fixed time. Tomorrow you read tracings, not notes.',
      to: '', label: 'Non-negotiable',
    },
  ];
  return (
    <>
      <Group label="Exam eve" heading="The night-before plan">
        <div className="ecg-welcome">
          <DrBeat size={72} />
          <div className="ecg-bubble">
            <p className="ecg-cap-name">Dr. Beat</p>
            <p className="ecg-cap-ar">
              Tomorrow you show what you know. Tonight we sharpen, we do not cram.
              Six steps, in order, then sleep.
            </p>
          </div>
        </div>
        <div className="ecg-exambar">
          <span className="ecg-chip">{solvedCount} / {totalCases} cases solved</span>
          <span className="ecg-chip">{doneModules} / {modules.length} modules complete</span>
          <span className="ecg-chip" style={missed.length > 0 ? { color: '#fff', background: '#b3261e' } : undefined}>
            {missed.length} open {missed.length === 1 ? 'miss' : 'misses'}
          </span>
        </div>
      </Group>
      <Group label="The plan" heading="Six steps, in order">
        {steps.map((s) => (
          <div key={s.n} className="ecg-teachcard">
            <p className="ecg-teachtitle">Step {s.n}: {s.what}</p>
            <Text><Paragraph>{s.why}</Paragraph></Text>
            {s.to && (
              <div className="ecg-modnav">
                <Link className="file-button is-compact" to={s.to}>{s.label}</Link>
              </div>
            )}
          </div>
        ))}
      </Group>
      <Group label="Exam morning" heading="The ritual at the paper">
        <div className="ecg-teachcard">
          <ul className="ecg-teachlist">
            <li>Read every tracing in the full fixed order: rate, rhythm, axis, intervals, then the waves. Even the obvious ones.</li>
            <li>Commit to a written diagnosis before you look at the options.</li>
            <li>Name the one feature that proves your diagnosis, and the one that excludes the closest alternative.</li>
            <li>For any abnormal tracing, ask the two extra questions: is the patient stable, and is there an old tracing to compare?</li>
          </ul>
        </div>
      </Group>
      <Group label="Master cheat sheet" heading="Every module, one scroll">
        <Text><Paragraph>
          All twelve module cheat sheets in one place. This is the last thing you read tonight
          and the first thing you skim in the morning.
        </Paragraph></Text>
        {modules.filter((m) => m.cheat && m.cheat.length > 0).map((m) => (
          <div key={m.id} className="ecg-teachcard">
            <p className="ecg-teachtitle">{m.num}. {m.title}</p>
            <Facts items={m.cheat!} />
          </div>
        ))}
      </Group>
      <div className="ecg-modnav">
        <Link className="file-button is-compact" data-variant="secondary" to="/">Module map</Link>
        <Link className="file-button is-compact" data-variant="secondary" to="/exam">Mock exam</Link>
      </div>
    </>
  );
}

// Case of the day: the date itself picks the case, so everyone gets the same
// one per day and a fresh one tomorrow.
function DailyPage({ onResult }: { onResult: (id: string, correct: boolean) => void }) {
  const today = new Date();
  const key = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const pick = ALL_CASES[hashStr(key) % ALL_CASES.length];
  const stamp = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <>
      <Group label="Case of the day" heading={stamp}>
        <Text><Paragraph>
          One case a day keeps the eye sharp. This one comes from the module "{pick.modTitle}".
          A new one lands tomorrow.
        </Paragraph></Text>
        <CaseCard kase={pick.kase} onAnswer={(correct) => onResult(pick.kase.id, correct)} />
      </Group>
      <div className="ecg-modnav">
        <Link className="file-button is-compact" data-variant="secondary" to="/">Module map</Link>
        <Link className="file-button is-compact" data-variant="secondary" to="/exam">Mock exam</Link>
      </div>
    </>
  );
}

// Spot it drills: tap the finding on the strip. Windows come straight from the
// generator's beat geometry (P at 0.06+k*aRR; QRS at P+pr+0.06; PVC at tR-0.35*RR).
const WPW_RR = 60 / 88;
const FD_RR = 60 / 70;
const WENCK_ARR = 60 / 75;
const PAUSE_RR = 60 / 65;
const pvcTimes = (() => {
  const RR = 60 / 80, pr = 0.16;
  const out: number[] = [];
  let tp = 0.06, beat = 0;
  while (tp < 6.5) {
    beat++;
    const tR = tp + pr + 0.06;
    if (beat % 2 === 0) { out.push(tR - RR * 0.35); tp += RR * 1.5; }
    else tp += RR;
  }
  return out.filter((t) => t + 0.09 < 6);
})();

const SPOTS: SpotDrill[] = [
  {
    id: 'spot-tallt',
    spec: { rhythm: { kind: 'regular', rate: 75 }, baseline: 'flat', morph: M({ tAmp: 0.55, tSig: 0.018, qtScale: 0.8 }),
      leads: leadII(), seconds: 4, seed: 117 },
    question: 'His potassium came back 7.1. Tap the wave that told you before the lab did.',
    windows: [0, 1, 2, 3].map((k): [number, number] => {
      const tR = 0.22 + k * 0.8;
      return [tR + 0.222, tR + 0.332];
    }),
    hitNote: 'That tall, narrow, symmetric T is the earliest ECG sign of rising potassium: tented T waves. Act before the QRS widens and the P waves disappear.',
    missHint: 'Look after the QRS: the T here is unusually tall, narrow and pointed, like a tent.',
    revealNote: 'The ring marks the peaked T wave. Tall, narrow and symmetric: suspect hyperkalemia and check the potassium now.',
    ringAmp: 0.6,
  },
  {
    id: 'spot-flutter',
    spec: { rhythm: { kind: 'regular', rate: 75, atrialRate: 300 }, baseline: 'sawtooth', noP: true, morph: M({}),
      leads: leadII(), seconds: 5, seed: 171 },
    question: 'Atrial flutter with 4:1 conduction. Tap a flutter wave: one tooth of the sawtooth.',
    windows: Array.from({ length: 25 }, (_, k): [number, number] => {
      const p = 0.14 + k * 0.2;
      return [p - 0.05, p + 0.05];
    }).filter((w) => w[1] < 5),
    hitNote: 'That tooth is an F wave: the atria circling at 300 a minute while the AV node passes only every fourth impulse. A calm rate of 75 can hide a flutter.',
    missHint: 'Forget the QRS spikes. The baseline itself marches in teeth, four for every QRS.',
    revealNote: 'The ring marks an F wave. Continuous sawtooth at 300 per minute with regular narrow QRS complexes: atrial flutter.',
    ringAmp: 0.3,
  },
  {
    id: 'spot-delta',
    spec: { rhythm: { kind: 'regular', rate: 88 }, baseline: 'flat', morph: M({}),
      leads: [{ label: 'Lead II', morph: { pr: 0.1, delta: 0.3, qrsW: 1.35 } }], seconds: 3, seed: 281 },
    question: 'WPW. Tap the delta wave: the slurred, slow start of the QRS.',
    windows: [0, 1, 2, 3].map((k): [number, number] => {
      const q = 0.06 + k * WPW_RR + 0.16;
      return [q - 0.1, q + 0.005];
    }),
    hitNote: 'That slur is the accessory pathway pre-exciting the ventricles before the AV node catches up. Short PR, delta wave, wide QRS: the WPW triad.',
    missHint: 'Look at the very start of the QRS, right after the short PR.',
    revealNote: 'The ring marks the delta wave: the slow upstroke at the start of the QRS.',
    ringAmp: 0.5,
  },
  {
    id: 'spot-p',
    spec: { rhythm: { kind: 'regular', rate: 70 }, baseline: 'flat', morph: M({ pr: 0.28 }),
      leads: leadII(), seconds: 6, seed: 73 },
    question: 'First degree AV block. Tap any P wave: the small bump marching well ahead of each QRS.',
    windows: [0, 1, 2, 3, 4, 5, 6].map((k): [number, number] => {
      const p = 0.06 + k * FD_RR;
      return [p - 0.05, p + 0.05];
    }),
    hitNote: 'That is the P wave. Here it sits a full 0.28 seconds before its QRS, longer than the 0.20 limit, but every P still gets through. That is first degree block.',
    missHint: 'The P is the small rounded bump before the tall spike, about seven small boxes ahead of it.',
    revealNote: 'The ring marks a P wave. Measure from its start to the QRS: over one big box, so the PR is prolonged.',
    ringAmp: 0.25,
  },
  {
    id: 'spot-pvc',
    spec: { rhythm: { kind: 'pvc2', rate: 80 }, baseline: 'flat', morph: M({}),
      leads: leadII(), seconds: 6, seed: 227 },
    question: 'Bigeminy. Tap the premature beat: the wide, bizarre one that arrives too early.',
    windows: pvcTimes.map((t): [number, number] => [t - 0.1, t + 0.12]),
    hitNote: 'Wide, early, no P before it, and a pause after: a ventricular beat, not an atrial one. Every second beat here is a PVC, which is bigeminy.',
    missHint: 'Alternate beats. The early wide one with the opposite shape is the PVC.',
    revealNote: 'The ring marks the PVC: early, wide, and followed by a compensatory pause.',
    ringAmp: 0.9,
  },
  {
    id: 'spot-dropped',
    spec: { rhythm: { kind: 'mobitz1', rate: 75 }, baseline: 'flat', morph: M({}),
      leads: leadII(), seconds: 8, seed: 79 },
    question: 'Wenckebach. Tap a P wave that conducts nothing: the one with no QRS after it.',
    windows: [2, 5, 8].map((i): [number, number] => {
      const p = 0.06 + i * WENCK_ARR;
      return [p - 0.05, p + 0.05];
    }),
    hitNote: 'That P wave never reaches the ventricles. Watch the PR stretch beat by beat until this one drops: the footprint of Mobitz I.',
    missHint: 'Follow the P waves, not the QRS spikes. One P in every group of three stands alone.',
    revealNote: 'The ring marks the dropped P wave. The PR lengthens, lengthens, then this one is not conducted.',
    ringAmp: 0.25,
  },
  {
    id: 'spot-pause',
    spec: { rhythm: { kind: 'pause', rate: 65 }, baseline: 'flat', morph: M({}),
      leads: leadII(), seconds: 7, seed: 88 },
    question: 'Sinus pause. Tap the pause itself: the long flat stretch where a whole beat should have been.',
    windows: [[0.06 + PAUSE_RR + 0.16 + 0.06 + 0.55, 0.06 + 3.1 * PAUSE_RR - 0.12]],
    hitNote: 'Silence on the tracing: the SA node skipped a whole cycle, then resumed. A long, flat, beatless stretch is the pause.',
    missHint: 'Find the longest empty gap on the baseline, right where the next beat is overdue.',
    revealNote: 'The ring marks the missing beat: a flat gap longer than a normal cycle, then the rhythm resumes.',
    ringAmp: 0,
  },
];

// Flashcards: every cheat-sheet line and study point becomes a recall card.
// 'Still learning' cards recycle to the back of the deck once.
interface FlashCard { front: string; back: string; mod: string; rec?: boolean; }
const FLASH_DECK: FlashCard[] = modules.filter((m) => m.shipped).flatMap((m) => [
  ...(m.cheat ?? []).map((c) => ({ front: c.label, back: c.value, mod: m.title })),
  ...(m.teach ?? []).map((t) => ({ front: t.title, back: t.points.join('  |  '), mod: m.title })),
]);

function FlashcardsPage() {
  const [seed, setSeed] = useState<number | null>(null);
  const [deck, setDeck] = useState<FlashCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [reviewed, setReviewed] = useState(0);

  const start = () => {
    const s = Date.now() % 2147483647;
    setSeed(s);
    setDeck(seededShuffle(FLASH_DECK, s));
    setIdx(0); setFlipped(false); setKnown(0); setReviewed(0);
  };

  if (seed === null) {
    return (
      <>
        <Group label="Flashcards" heading="Active recall, exam style">
          <Text><Paragraph>
            Every cheat-sheet line and study point from all twelve modules, as flip cards.
            Read the front, say the answer out loud, tap to check. Cards you mark
            "still learning" come back at the end of the deck.
          </Paragraph></Text>
          <button type="button" className="ecg-opt ecg-play" onClick={start}>Shuffle and start</button>
        </Group>
        <div className="ecg-modnav">
          <Link className="file-button is-compact" data-variant="secondary" to="/">Module map</Link>
        </div>
      </>
    );
  }

  if (idx >= deck.length) {
    const verdict = reviewed === 0 ? 'A clean sweep. Every card known, first pass.'
      : reviewed <= 6 ? `Only ${reviewed} needed a second pass. Sharp.`
      : `${reviewed} cards needed review. Run the deck again and watch that number fall.`;
    return (
      <>
        <Group label="Flashcards - deck done" heading={`${known} known, ${reviewed} reviewed`}>
          <Callout title={verdict} tone={reviewed <= 6 ? 'note' : 'warning'}>
            The deck reshuffles every run, so cards never get memorized by position.
          </Callout>
        </Group>
        <div className="ecg-modnav">
          <button type="button" className="ecg-opt ecg-play" onClick={start}>Run the deck again</button>
          <Link className="file-button is-compact" data-variant="secondary" to="/">Module map</Link>
        </div>
      </>
    );
  }

  const card = deck[idx];
  const advance = (knewIt: boolean) => {
    if (knewIt) setKnown((k) => k + 1);
    else { setReviewed((r) => r + 1); if (!card.rec) setDeck((d) => [...d, { ...card, rec: true }]); }
    setFlipped(false);
    setIdx((i) => i + 1);
  };

  return (
    <>
      <Group label="Flashcards" heading>
        <div className="ecg-exambar">
          <span className="ecg-chip">Card {idx + 1} / {deck.length}</span>
          <span className="ecg-chip">Known {known}</span>
        </div>
        <div className="ecg-flash" onClick={() => setFlipped((f) => !f)} role="button" aria-label="Flip the card">
          <span className="ecg-chip">{card.mod}</span>
          <p className="ecg-flash-front">{card.front}</p>
          {flipped
            ? <p className="ecg-flash-back">{card.back}</p>
            : <p className="ecg-flash-tap">Tap to flip</p>}
        </div>
        {flipped && (
          <div className="ecg-hallrow">
            <button type="button" className="ecg-opt ecg-play" onClick={() => advance(true)}>Knew it</button>
            <button type="button" className="ecg-opt" onClick={() => advance(false)}>Still learning</button>
          </div>
        )}
      </Group>
    </>
  );
}

// Compare & Explain drills: confusable pairs, tap the giveaway on either strip.
const CMP_RR75 = 60 / 75;
const CMP_RR78 = 60 / 78;
const cmpDrop = [2, 5, 8].map((i) => 0.06 + i * CMP_RR75);
const cmpVent = [0, 1, 2, 3, 4, 5].map((k) => 0.06 + k * CMP_RR78 + 0.22);

const COMPARES: CompareDrill[] = [
  {
    id: 'cmp-blocks',
    title: 'Two tracings that both drop beats',
    question: 'One is Wenckebach (Mobitz I), one is Mobitz II. Tap a dropped P wave on either tracing.',
    missHint: 'Look for a P wave with no QRS after it. It is there in both.',
    a: {
      name: 'Wenckebach (Mobitz I)',
      spec: { rhythm: { kind: 'mobitz1', rate: 75 }, baseline: 'flat', morph: M({}), leads: leadII(), seconds: 8, seed: 79 },
      targets: cmpDrop.map((t) => ({ lead: 0, t0: t - 0.05, t1: t + 0.05, ringAmp: 0.25 })),
      note: 'The PR interval stretches beat by beat until the ringed P wave is dropped. The drop is announced, so the lesion sits in the AV node and is usually benign.',
    },
    b: {
      name: 'Mobitz II',
      spec: { rhythm: { kind: 'mobitz2', rate: 75 }, baseline: 'flat', morph: M({}), leads: leadII(), seconds: 8, seed: 83 },
      targets: cmpDrop.map((t) => ({ lead: 0, t0: t - 0.05, t1: t + 0.05, ringAmp: 0.25 })),
      note: 'The PR interval stays fixed on every conducted beat, then the ringed P wave drops without warning. The disease is infranodal and can become complete block: pacemaker talk.',
    },
  },
  {
    id: 'cmp-early',
    title: 'Two tracings with an early beat',
    question: 'One early beat is ventricular (PVC), one is atrial (PAC). Tap the early beat on either tracing.',
    missHint: 'Find the beat that arrives before its turn. One in each tracing.',
    a: {
      name: 'PVC (bigeminy)',
      spec: { rhythm: { kind: 'pvc2', rate: 80 }, baseline: 'flat', morph: M({}), leads: leadII(), seconds: 6, seed: 227 },
      targets: pvcTimes.map((t) => ({ lead: 0, t0: t - 0.1, t1: t + 0.12, ringAmp: 0.9 })),
      note: 'The ringed beat is wide and bizarre, no P wave before it, and a full compensatory pause after. Born in the ventricles, so it writes its own shape.',
    },
    b: {
      name: 'PAC',
      spec: { rhythm: { kind: 'pac', rate: 78 }, baseline: 'flat', morph: M({}), leads: leadII(), seconds: 6, seed: 81 },
      targets: [2.3754, 5.4908].map((t) => ({ lead: 0, t0: t - 0.05, t1: t + 0.07, ringAmp: 0.6 })),
      note: 'The ringed beat is early but NARROW: an ectopic atrial focus fired an abnormally shaped P, then used the normal wiring. The pause after it is short.',
    },
  },
  {
    id: 'cmp-bbb',
    title: 'Two wide QRS tracings (V1 and V6)',
    question: 'One is RBBB, one is LBBB. Tap the giveaway: the second rabbit ear in V1, or the broad R in V6.',
    missHint: 'In V1 look for two peaks; in V6 look for one wide flat-topped R.',
    a: {
      name: 'RBBB',
      spec: { rhythm: { kind: 'regular', rate: 78 }, baseline: 'flat', morph: M({}),
        leads: [
          { label: 'V1', morph: { rAmp: 0.5, r2Amp: 1.0, sAmp: -0.15, qrsW: 1.5, tInvert: true, tAmp: 0.2, qAmp: 0 } },
          { label: 'V6', morph: { sAmp: -0.45, qrsW: 1.5, rAmp: 0.95 } },
        ], seconds: 5, seed: 90 },
      targets: cmpVent.map((t) => ({ lead: 0, t0: t + 0.04, t1: t + 0.09, ringAmp: 0.7 })),
      note: 'The ringed second peak in V1 is the R prime: the right ventricle depolarizing late. rsR in V1 plus a wide slurred S in V6 names RBBB.',
    },
    b: {
      name: 'LBBB',
      spec: { rhythm: { kind: 'regular', rate: 78 }, baseline: 'flat', morph: M({}),
        leads: [
          { label: 'V1', morph: { rAmp: 0.1, sAmp: -1.4, qAmp: 0, qrsW: 1.6, st: 0.2, tAmp: 0.4 } },
          { label: 'V6', morph: { rAmp: 1.2, sAmp: 0, qAmp: 0, qrsW: 1.6, st: -0.15, tInvert: true, tAmp: 0.3 } },
        ], seconds: 5, seed: 92 },
      targets: cmpVent.map((t) => ({ lead: 1, t0: t - 0.035, t1: t + 0.05, ringAmp: 0.8 })),
      note: 'The ringed R in V6 is broad and flat-topped with no S after it: the left ventricle depolarizing slowly and late. Deep S in V1 plus broad R in V6 names LBBB.',
    },
  },
  {
    id: 'cmp-st',
    title: 'Two tracings with ST elevation in V3',
    question: 'One is an acute STEMI, one is benign early repolarization. Tap the elevated ST segment on either tracing.',
    missHint: 'The ST segment is the shelf between the QRS spike and the T wave.',
    a: {
      name: 'Acute STEMI',
      spec: { rhythm: { kind: 'regular', rate: 75 }, baseline: 'flat', morph: M({}),
        leads: [{ label: 'V3', morph: { st: 0.35 } }], seconds: 4, seed: 95 },
      targets: [0.28, 1.08, 1.88, 2.68, 3.48].filter((t) => t + 0.2 < 4).map((t) => ({ lead: 0, t0: t + 0.07, t1: t + 0.2, ringAmp: 0.45 })),
      note: 'The ringed ST segment holds its height in a straight, convex shelf, like a tombstone. Regional, in one territory, with reciprocal depression opposite: an occluded artery until proven otherwise.',
    },
    b: {
      name: 'Early repolarization',
      spec: { rhythm: { kind: 'regular', rate: 75 }, baseline: 'flat', morph: M({}),
        leads: [{ label: 'V3', morph: { st: 0.18, stConcave: true } }], seconds: 4, seed: 97 },
      targets: [0.28, 1.08, 1.88, 2.68, 3.48].filter((t) => t + 0.2 < 4).map((t) => ({ lead: 0, t0: t + 0.07, t1: t + 0.2, ringAmp: 0.3 })),
      note: 'The ringed ST segment lifts gently and curves upward like a smile: concave. Diffuse across many leads, in a young well patient, with no reciprocal change: benign early repolarization. Compare old tracings and the story.',
    },
  },
  {
    id: 'cmp-tallt',
    title: 'Two tracings with unusually tall T waves',
    question: 'One is a hyperacute T of an occluding artery, one is hyperkalemia. Tap the tall T wave on either tracing.',
    missHint: 'The T wave is the whole finding here: compare how wide its base is.',
    a: {
      name: 'Hyperacute T wave',
      spec: { rhythm: { kind: 'regular', rate: 75 }, baseline: 'flat', morph: M({}),
        leads: [{ label: 'V3', morph: { tAmp: 0.6, tSig: 0.05 } }], seconds: 4, seed: 141 },
      targets: [0.22, 1.02, 1.82, 2.62, 3.42].filter((t) => t + 0.42 < 4).map((t) => ({ lead: 0, t0: t + 0.26, t1: t + 0.42, ringAmp: 0.65 })),
      note: 'The ringed T is tall but broad at its base: the hyperacute T wave of an artery that is occluding right now, minutes before the ST segment rises. Chest pain plus this T means activate the pathway, not wait for elevation.',
    },
    b: {
      name: 'Hyperkalemia',
      spec: { rhythm: { kind: 'regular', rate: 75 }, baseline: 'flat', morph: M({}),
        leads: [{ label: 'V3', morph: { tAmp: 0.55, tSig: 0.018, qtScale: 0.8 } }], seconds: 4, seed: 143 },
      targets: [0.22, 1.02, 1.82, 2.62, 3.42].map((t) => ({ lead: 0, t0: t + 0.2, t1: t + 0.34, ringAmp: 0.6 })),
      note: 'The ringed T is tall but narrow and pointed like a tent, riding a short QT: hyperkalemia. Check the potassium and act before the QRS widens and the P waves vanish.',
    },
  },
];

function ComparePage() {
  return (
    <>
      <Group label="Compare & Explain" heading="Two tracings, one difference">
        <Text><Paragraph>
          The exam loves confusable pairs. Here they stand side by side: tap the feature that
          separates them, on either tracing, and both explanations appear together.
        </Paragraph></Text>
        {COMPARES.map((d) => <CompareCard key={d.id} drill={d} />)}
      </Group>
      <div className="ecg-modnav">
        <Link className="file-button is-compact" data-variant="secondary" to="/">Module map</Link>
        <Link className="file-button is-compact" data-variant="secondary" to="/spot">Spot it</Link>
      </div>
    </>
  );
}

function SpotPage() {
  return (
    <>
      <Group label="Spot it" heading="Tap the finding">
        <Text><Paragraph>
          The exam asks you to name the finding. This drill makes your finger find it first.
          Tap the exact wave on the strip; three tries, then the ring shows you where it lives.
        </Paragraph></Text>
        {SPOTS.map((d) => <SpotCard key={d.id} drill={d} />)}
      </Group>
      <div className="ecg-modnav">
        <Link className="file-button is-compact" data-variant="secondary" to="/">Module map</Link>
        <Link className="file-button is-compact" data-variant="secondary" to="/sprint">Sprint</Link>
      </div>
    </>
  );
}

function IntervalsPage() {
  return (
    <>
      <Group label="Interval drill" heading="Measure the PR and the QRS">
        <Text><Paragraph>
          After rate and axis come the intervals. Each round shows a fresh strip and asks you to judge
          the PR interval or the QRS width against the anchor numbers, until three-to-five small boxes
          and under-three small boxes feel like old friends.
        </Paragraph></Text>
        <IntervalDrill />
      </Group>
      <div className="ecg-modnav">
        <Link className="file-button is-compact" data-variant="secondary" to="/">Module map</Link>
        <Link className="file-button is-compact" data-variant="secondary" to="/rate">Rate drill</Link>
      </div>
    </>
  );
}

function RatePage() {
  return (
    <>
      <Group label="Rate drill" heading="How fast is it going?">
        <Text><Paragraph>
          Every systematic read starts with the rate, and the exam expects it in seconds.
          Call the ventricular rate of each fresh strip, then the 300 rule appears with the answer
          until you stop needing it.
        </Paragraph></Text>
        <RateDrill />
      </Group>
      <div className="ecg-modnav">
        <Link className="file-button is-compact" data-variant="secondary" to="/">Module map</Link>
        <Link className="file-button is-compact" data-variant="secondary" to="/axis">Axis drill</Link>
      </div>
    </>
  );
}

function AxisPage() {
  return (
    <>
      <Group label="Axis drill" heading="Which way does the current run?">
        <Text><Paragraph>
          Every exam paper has an axis question, and it takes ten seconds when you only read two leads:
          I and aVF. Call the quadrant, check the rule, and go again. Each round draws a fresh axis.
        </Paragraph></Text>
        <AxisDrill />
      </Group>
      <div className="ecg-modnav">
        <Link className="file-button is-compact" data-variant="secondary" to="/">Module map</Link>
        <Link className="file-button is-compact" data-variant="secondary" to="/exam">Mock exam</Link>
      </div>
    </>
  );
}

// Mock exam: 10 mixed cases from every module, 10 minutes on the clock,
// answers lock when tapped, score and full review at the end.
function ExamPage({ onResult }: { onResult: (id: string, correct: boolean) => void }) {
  const [seed, setSeed] = useState<number | null>(null);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState(600);
  const [finished, setFinished] = useState(false);
  const [awaitingNext, setAwaitingNext] = useState(false);
  const picks = useMemo(() => (seed === null ? [] : seededShuffle(ALL_CASES, seed).slice(0, 10)), [seed]);

  useEffect(() => {
    if (seed === null || finished) return;
    const t = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) { clearInterval(t); setFinished(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [seed, finished]);

  if (seed === null) {
    return (
      <>
        <Group label="Mock exam" heading="Exam mode">
          <Text><Paragraph>
            Ten cases drawn from all twelve modules, ten minutes on the clock, exam rules:
            no hints once you commit, and every answer locks when you tap it. After each case you get
            the explanation, and at the end a full review with your score. Dr. Beat is watching the clock.
          </Paragraph></Text>
          <button type="button" className="ecg-opt ecg-play" onClick={() => { setSeed(Date.now() % 2147483647); setTimeLeft(600); }}>
            Start the exam
          </button>
        </Group>
        <div className="ecg-modnav">
          <Link className="file-button is-compact" data-variant="secondary" to="/">Module map</Link>
        </div>
      </>
    );
  }

  const score = results.filter(Boolean).length;
  const cur = picks[idx];

  if (finished || idx >= picks.length) {
    const verdict = score >= 9 ? 'Consultant material. The real exam should be scared of you.'
      : score >= 7 ? 'Exam ready. Keep the daily cases coming.'
      : score >= 5 ? 'Close. Drill the modules you missed and retake.'
      : 'Back to the modules. Every case you solve there shows up here.';
    return (
      <>
        <Group label="Mock exam - result" heading={`${score} out of ${picks.length}`}>
          <Callout title={verdict} tone={score >= 7 ? 'note' : 'warning'}>
            {timeLeft === 0 && idx < picks.length
              ? `Time ran out at case ${idx + 1}. Unanswered cases count as missed. `
              : ''}
            Review every case below, then retake. The shuffle is fresh every attempt.
          </Callout>
          {picks.map((p, i) => {
            const ok = !!results[i];
            return (
              <div key={p.kase.id} className="ecg-review">
                <p className="ecg-question">{i + 1}. {p.kase.question}</p>
                <p className={ok ? 'ecg-rev-ok' : 'ecg-rev-bad'}>
                  {ok ? 'You got it right.' : 'You missed it.'} Correct answer: {p.kase.options[p.kase.answer]}
                </p>
                <p className="ecg-whynot"><strong>Why:</strong> {p.kase.explain}</p>
                {p.kase.whyNot && <p className="ecg-whynot"><strong>Why the others are wrong:</strong> {p.kase.whyNot}</p>}
              </div>
            );
          })}
        </Group>
        <div className="ecg-modnav">
          <button type="button" className="ecg-opt ecg-play" onClick={() => { setSeed(null); setIdx(0); setResults([]); setFinished(false); setAwaitingNext(false); }}>
            Retake with a fresh shuffle
          </button>
          <Link className="file-button is-compact" data-variant="secondary" to="/">Module map</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Group label="Mock exam" heading>
        <div className="ecg-exambar">
          <span className="ecg-chip">Case {idx + 1} / {picks.length}</span>
          <span className="ecg-chip" style={timeLeft < 60 ? { color: '#fff', background: '#b3261e' } : undefined}>
            {fmtClock(timeLeft)}
          </span>
          <span className="ecg-chip">Score {score}</span>
        </div>
        {cur && (
          <CaseCard
            key={cur.kase.id + '-' + idx}
            kase={cur.kase}
            onAnswer={(correct) => {
              onResult(cur.kase.id, correct);
              setResults((r) => { const n = [...r]; n[idx] = correct; return n; });
              setAwaitingNext(true);
            }}
          />
        )}
        {awaitingNext && (
          <button type="button" className="ecg-opt ecg-play" onClick={() => {
            setAwaitingNext(false);
            if (idx + 1 >= picks.length) setFinished(true);
            else setIdx(idx + 1);
          }}>
            {idx + 1 >= picks.length ? 'Finish and see the score' : 'Next case'}
          </button>
        )}
      </Group>
    </>
  );
}

function Map({ solved, missed }: { solved: Record<string, boolean>; missed: string[] }) {
  const missedCount = missed.length;
  const shippedCount = modules.filter((m) => m.shipped).length;
  return (
    <>
      <div className="ecg-welcome">
        <DrBeat size={72} />
        <div className="ecg-bubble">
          <p className="ecg-cap-name">Dr. Beat</p>
          <p className="ecg-cap-ar">I'm Dr. Beat. Start at module 1 and work down: watch the narrated explanation, then practice.</p>
        </div>
      </div>
      <Group label={`Modules - ${shippedCount} of 12 ready`} heading>
        <Rows>
          {modules.map((m) => {
            const total = (m.cases?.length ?? 0) + (m.orderQuiz ? 1 : 0);
            const done = m.cases?.filter((c) => solved[c.id]).length ?? 0;
            const shaky = missed.filter((id) => id.startsWith(`m${m.num}c`)).length;
            const detail = m.shipped
              ? `${m.chapters} - ${m.tagline}${total ? ` (${done} of ${total} done${shaky ? `, ${shaky} to review` : ''})` : ''}`
              : `${m.chapters} - coming soon, in the works now`;
            return m.shipped ? (
              <Link key={m.id} to={`/m/${m.id}`} className="ecg-maplink">
                <Row number={m.num} name={m.title} detail={detail} />
              </Link>
            ) : (
              <Row key={m.id} number={m.num} name={m.title} detail={detail} />
            );
          })}
        </Rows>
      </Group>
      <Group label="Exam hall" heading>
        <div className="ecg-hallrow">
          <Link className="file-button" to="/tonight">Exam eve: the plan + master cheat sheet</Link>
          <Link className="file-button" to="/daily">Case of the day</Link>
          <Link className="file-button" to="/flashcards">Flashcards</Link>
          <Link className="file-button" to="/compare">Compare & Explain</Link>
          <Link className="file-button" to="/spot">Spot it: tap the finding</Link>
          <Link className="file-button" to="/axis">Axis drill</Link>
          <Link className="file-button" to="/rate">Rate drill</Link>
          <Link className="file-button" to="/intervals">Interval drill</Link>
          <Link className="file-button" to="/sprint">Sprint: 60 seconds</Link>
          <Link className="file-button" to="/misses">{missedCount > 0 ? `Fix my misses (${missedCount})` : 'Fix my misses'}</Link>
          <Link className="file-button" to="/exam">Mock exam: 10 cases, 10 minutes</Link>
        </div>
      </Group>
    </>
  );
}

export function App() {
  const [progress, setProgress, saved] = useLocalState<{ solved: Record<string, boolean>; missed: string[] }>('ecg2-progress.v1', { solved: {}, missed: [] });
  // Pin the document language (English UI) so mobile browsers leave it alone.
  useEffect(() => {
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
  }, []);
  const solved = progress.solved ?? {};
  const missed = progress.missed ?? [];
  const onResult = (id: string, correct: boolean) => {
    if (!saved.ready) return;
    const nextSolved = correct ? { ...solved, [id]: true } : solved;
    const nextMissed = correct ? missed.filter((m) => m !== id) : (missed.includes(id) ? missed : [...missed, id]);
    setProgress({ solved: nextSolved, missed: nextMissed });
  };

  return (
    <FileCard lang="en" dir="ltr">
      <Header
        title="ECG Sprint 2"
        fact={`${Object.keys(solved).length} cases solved`}
        intro="Read any ECG step by step: narrated animation with Dr. Beat, then practice. Follows the book Learn ECG in a Day chapter by chapter."
      />
      <nav className="file-nav" aria-label="File pages"><NavLink to="/" end>Module map</NavLink></nav>
      <Routes>
        <Route path="/" element={<Map solved={solved} missed={missed} />} />
        <Route path="/daily" element={<DailyPage onResult={onResult} />} />
        <Route path="/exam" element={<ExamPage onResult={onResult} />} />
        <Route path="/misses" element={<MissesPage missed={missed} onResult={onResult} />} />
        <Route path="/flashcards" element={<FlashcardsPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/spot" element={<SpotPage />} />
        <Route path="/axis" element={<AxisPage />} />
        <Route path="/rate" element={<RatePage />} />
        <Route path="/intervals" element={<IntervalsPage />} />
        <Route path="/sprint" element={<SprintPage onResult={onResult} />} />
        <Route path="/tonight" element={<TonightPage solved={solved} missed={missed} />} />
        {modules.filter((m) => m.shipped).map((m) => (
          <Route key={m.id} path={`/m/${m.id}`} element={<ModulePage mod={m} solved={solved} onResult={onResult} />} />
        ))}
      </Routes>
      <Closing>
        Built on Learn ECG in a Day (Sajjan M, JAYPEE) in original wording. Strips are simulated for teaching.
      </Closing>
    </FileCard>
  );
}
