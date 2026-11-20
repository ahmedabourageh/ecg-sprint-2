import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CaseSpec } from './waveforms';
import { EcgFigure, Mark } from './ECG';
import { DrBeat } from './DrNabdh';

export interface ExplainStep {
  at: number;   // legacy hint, kept for authoring readability
  text: string; // on-screen explanation text (matches the narration)
}

// Per-step motion graphics: a camera cue (stage fractions + zoom) plus marks
// drawn on specific leads, in strip time (seconds) and amplitude (mm).
export interface StepChoreo {
  cam?: { x: number; y: number; z: number };
  marks?: Array<Mark & { lead: number }>;
}

// Optional voiceover: one audio clip per narrated step (blob/data URIs) plus
// measured durations. Steps beyond the clip list play silently on a timer
// estimated from their text length (used while narration batches are in flight).
export interface ExplainAudio {
  uris: string[];   // data: URIs, parallel to the narrated steps
  secs: number[];   // measured clip durations in seconds
}

// Estimated spoken duration for a step without a narration clip.
const estSecs = (text: string) => Math.max(5, text.trim().split(/\s+/).length / 2.55 + 1.2);

// Animated explainer: the strip is revealed left to right like a video,
// with synced explanation steps. A moving cursor marks the pen.
export function Explainer({ spec, steps, audio, choreo }: { spec: CaseSpec; steps: ExplainStep[]; audio?: ExplainAudio; choreo?: StepChoreo[] }) {
  const hasAudio = !!audio && audio.uris.length > 0 && audio.secs.length === audio.uris.length;
  const [audioOk, setAudioOk] = useState(true);
  useEffect(() => { setAudioOk(true); }, [audio]);
  const useAudio = hasAudio && audioOk;
  const gap = 0.3;

  // Per-step durations: measured for narrated steps, estimated for silent ones.
  const stepSecs = useMemo(
    () => steps.map((s, i) => (useAudio && i < audio!.uris.length ? audio!.secs[i] : estSecs(s.text))),
    [steps, audio, useAudio],
  );

  // Step boundaries (fractions of the whole timeline).
  const bounds = useMemo(() => {
    const total = stepSecs.reduce((a, b) => a + b, 0) + gap * (steps.length - 1);
    const out: number[] = [];
    let acc = 0;
    for (let i = 0; i < steps.length; i++) {
      out.push(acc / total);
      acc += stepSecs[i] + (i < steps.length - 1 ? gap : 0);
    }
    return out;
  }, [stepSecs, steps.length]);

  const totalSec = useMemo(
    () => stepSecs.reduce((a, b) => a + b, 0) + gap * (steps.length - 1),
    [stepSecs, steps.length],
  );

  const [frac, setFrac] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const raf = useRef<number | null>(null);
  const started = useRef(0);
  const el = useRef<HTMLAudioElement | null>(null);
  const clipIdx = useRef(0);
  const clipStartFrac = useRef(0); // frac at which the current clip starts
  const silent = useRef<{ start: number; timer: ReturnType<typeof setTimeout> } | null>(null);

  const clearSilent = () => {
    if (silent.current) { clearTimeout(silent.current.timer); silent.current = null; }
  };

  // Locate the step and intra-step offset (seconds) owning fraction f.
  const locate = (f: number) => {
    let idx = 0;
    for (let i = 0; i < bounds.length; i++) if (f >= bounds[i]) idx = i;
    const off = Math.min(Math.max(0, (f - bounds[idx]) * totalSec), stepSecs[idx]);
    return { idx, off };
  };

  // Arm a step: play its clip, or run a silent timer for steps without one.
  const armStep = (idx: number, offsetSec: number) => {
    clearSilent();
    if (idx >= steps.length) {
      setFrac(1);
      setPlaying(false);
      return;
    }
    clipIdx.current = idx;
    clipStartFrac.current = bounds[idx];
    const a = el.current;
    if (a && idx < audio!.uris.length) {
      a.src = audio!.uris[idx];
      a.currentTime = offsetSec;
      a.muted = muted;
      const p = a.play();
      if (p) p.catch(() => setAudioOk(false));
    } else {
      if (a) a.pause();
      const dur = stepSecs[idx];
      silent.current = {
        start: performance.now() - offsetSec * 1000,
        timer: setTimeout(() => armStep(idx + 1, 0), Math.max(0, (dur - offsetSec) * 1000)),
      };
    }
  };
  const armRef = useRef(armStep);
  armRef.current = armStep;

  // Build / tear down the audio element.
  useEffect(() => {
    if (!useAudio) return;
    const a = new Audio();
    a.preload = 'auto';
    el.current = a;
    const onEnded = () => armRef.current(clipIdx.current + 1, 0);
    const onError = () => setAudioOk(false);
    a.addEventListener('ended', onEnded);
    a.addEventListener('error', onError);
    return () => {
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('error', onError);
      a.pause();
      el.current = null;
    };
  }, [useAudio, steps.length, audio]);

  useEffect(() => () => clearSilent(), []);

  useEffect(() => {
    if (el.current) el.current.muted = muted;
  }, [muted]);

  // rAF driver.
  useEffect(() => {
    if (!playing) return;
    if (useAudio) {
      const tick = () => {
        let f: number;
        if (silent.current) {
          f = Math.min(1, clipStartFrac.current + ((performance.now() - silent.current.start) / 1000) / totalSec);
        } else {
          const a = el.current;
          f = a ? Math.min(1, clipStartFrac.current + (a.currentTime / totalSec)) : 0;
        }
        setFrac(f);
        raf.current = requestAnimationFrame(tick);
      };
      raf.current = requestAnimationFrame(tick);
      return () => { if (raf.current) cancelAnimationFrame(raf.current); };
    }
    started.current = performance.now() - frac * totalSec * 1000;
    const tick = (now: number) => {
      const f = Math.min(1, (now - started.current) / (totalSec * 1000));
      setFrac(f);
      if (f < 1) raf.current = requestAnimationFrame(tick);
      else setPlaying(false);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [playing]); // eslint-disable-line react-hooks/exhaustive-deps

  const onPlayClick = () => {
    if (frac >= 1) return;
    if (useAudio) {
      const { idx, off } = locate(frac);
      armStep(idx, off);
    }
    setPlaying(true);
  };

  const onPauseClick = () => {
    clearSilent();
    if (el.current) el.current.pause();
    setPlaying(false);
  };

  const onRestart = () => {
    clearSilent();
    if (el.current) { el.current.pause(); el.current.currentTime = 0; }
    clipIdx.current = 0;
    clipStartFrac.current = 0;
    setPlaying(false);
    setFrac(0);
  };

  // Scrub bar: narration, subtitles and animation all jump together.
  const onSeek = (f: number) => {
    const nf = Math.min(1, Math.max(0, f));
    clearSilent();
    if (playing && useAudio) {
      const { idx, off } = locate(nf);
      armStep(idx, off);
    } else {
      if (el.current) el.current.pause();
      if (playing) started.current = performance.now() - nf * totalSec * 1000;
    }
    if (nf >= 1) setPlaying(false);
    setFrac(nf);
  };

  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60);
    const ss = Math.floor(sec % 60);
    return m + ':' + String(ss).padStart(2, '0');
  };

  const stepIdx = bounds.reduce((acc, b, i) => (frac >= b ? i : acc), 0);
  const step = steps[stepIdx];
  const spotOn = playing && frac < 1;

  // User-controlled zoom / pan and fullscreen (asked for explicitly: let him
  // enlarge the stage and inspect whatever he wants during the explanation).
  const [uz, setUz] = useState(1);
  const [upan, setUpan] = useState({ x: 0, y: 0 });
  const [full, setFull] = useState(false);
  const cinemaRef = useRef<HTMLDivElement | null>(null);
  const toggleFull = () => {
    setFull((f) => {
      if (!f) setTimeout(() => cinemaRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 60);
      return !f;
    });
  };
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);

  const zoomIn = () => setUz((z) => Math.min(3.5, Math.round((z + 0.5) * 2) / 2));
  const zoomOut = () => setUz((z) => {
    const nz = Math.max(1, Math.round((z - 0.5) * 2) / 2);
    if (nz === 1) setUpan({ x: 0, y: 0 });
    return nz;
  });
  const zoomReset = () => { setUz(1); setUpan({ x: 0, y: 0 }); };

  const onPanStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (uz <= 1) return;
    drag.current = { px: e.clientX, py: e.clientY, x: upan.x, y: upan.y };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };
  const onPanMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const lim = 170 * uz;
    setUpan({
      x: Math.min(lim, Math.max(-lim, d.x + (e.clientX - d.px))),
      y: Math.min(lim, Math.max(-lim, d.y + (e.clientY - d.py))),
    });
  };
  const onPanEnd = () => { drag.current = null; };

  // Camera: authored cue wins; otherwise follow the pen with a gentle zoom.
  const cue = choreo && choreo[stepIdx];
  const single = spec.leads.length === 1;
  const few = spec.leads.length > 1 && spec.leads.length <= 4;
  const cam = cue?.cam ?? { x: Math.min(0.92, frac + 0.08), y: 0.5, z: single ? 1.45 : 1.12 };
  // Clamp the camera center so the zoomed figure always covers the stage
  // (no dark letterbox at the edges): center must stay within [0.5/z, 1-0.5/z].
  const half = 0.5 / cam.z;
  const cx = Math.min(Math.max(cam.x, half), 1 - half);
  const cy = Math.min(Math.max(cam.y, half), 1 - half);
  const panStyle: React.CSSProperties = {
    transform: `translate(${(0.5 - cx) * 100}%, ${(0.5 - cy) * 100}%) scale(${cam.z})`,
    transformOrigin: `${cx * 100}% ${cy * 100}%`,
  };
  const marksByLead: Record<number, Mark[]> = {};
  if (cue?.marks) for (const m of cue.marks) {
    const { lead, ...mark } = m;
    (marksByLead[lead] = marksByLead[lead] || []).push(mark as Mark);
  }
  const spotLeft = (cam.z * (frac - cx) + 0.5) * 100;

  // Pointer arrow: aims at the first authored mark of the current step, so the
  // student always sees exactly which wave the narration is talking about.
  const nLeads = spec.leads.length;
  const cols = nLeads === 1 ? 1 : nLeads <= 4 ? 2 : 4;
  const rows = Math.ceil(nLeads / cols);
  let ptr: { x: number; y: number } | null = null;
  if (cue?.marks && cue.marks.length) {
    const m0 = cue.marks[0];
    const tMid = m0.t0 + (m0.t1 !== undefined ? (m0.t1 - m0.t0) / 2 : 0);
    const px = ((m0.lead % cols) + Math.min(0.97, Math.max(0.03, tMid / spec.seconds))) / cols;
    const py = (Math.floor(m0.lead / cols) + 0.5) / rows - (m0.amp || 0) * 0.026 / rows;
    ptr = { x: px * 100, y: Math.min(96, Math.max(4, py * 100)) };
  }

  return (
    <div className="ecg-explainer">
      <div ref={cinemaRef} className={`ecg-cinema${full ? ' ecg-cinema--full' : ''}`}>
        <div className="ecg-zoomctl" dir="ltr">
          <button type="button" onClick={zoomOut} aria-label="Zoom out" disabled={uz <= 1}>−</button>
          <button type="button" onClick={zoomIn} aria-label="Zoom in" disabled={uz >= 3.5}>+</button>
          {uz > 1 && <button type="button" onClick={zoomReset}>Reset</button>}
          <button type="button" onClick={toggleFull}>{full ? 'Exit full screen' : 'Full screen'}</button>
        </div>
        <div
          className={`ecg-stage${single ? ' is-single' : ''}${few ? ' ecg-stage--few' : ''}`} dir="ltr"
          style={{ touchAction: uz > 1 ? 'none' : 'pan-y', cursor: uz > 1 ? 'grab' : undefined }}
          onPointerDown={onPanStart} onPointerMove={onPanMove} onPointerUp={onPanEnd} onPointerCancel={onPanEnd}
          onDoubleClick={toggleFull}
        >
          <div className="ecg-uzoom" style={{ transform: `translate(${upan.x}px, ${upan.y}px) scale(${uz})`, transformOrigin: '50% 50%' }}>
            <div className="ecg-pan" style={panStyle}>
              <div className="ecg-dim">
                <EcgFigure spec={spec} marksByLead={marksByLead} />
              </div>
              <div className="ecg-clip" style={{ clipPath: `inset(0 ${(100 - frac * 100).toFixed(2)}% 0 0)` }}>
                <EcgFigure spec={spec} marksByLead={marksByLead} />
              </div>
              <div className="ecg-cursor" style={{ left: `${(frac * 100).toFixed(2)}%` }} />
              {ptr && frac < 1 && (
                <div className="ecg-pointer" style={{ left: `${ptr.x.toFixed(2)}%`, top: `${ptr.y.toFixed(2)}%` }}>
                  <svg viewBox="0 0 24 32" width="24" height="32" aria-hidden="true">
                    <path d="M12 30 L3.5 13.5 h5.5 V2 h6 v11.5 h5.5 Z" fill="#e4572e" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
            {spotOn && (
              <div className="ecg-spot" style={{ left: `calc(${spotLeft.toFixed(2)}% - 90px)` }} />
            )}
          </div>
          <div className="ecg-chapter">{stepIdx + 1} / {steps.length}</div>
        </div>
        <div className="ecg-sub">
          <DrBeat size={44} talking={playing && !muted && hasAudio} />
          <p dir="auto">{step.text}</p>
        </div>
        <div className="ecg-seek">
          <input
            type="range"
            className="ecg-range"
            min={0}
            max={1000}
            value={Math.round(frac * 1000)}
            onChange={(e) => onSeek(Number(e.target.value) / 1000)}
            aria-label="Seek through the explanation"
          />
          <span className="ecg-time">{fmt(frac * totalSec)} / {fmt(totalSec)}</span>
        </div>
      </div>
      <div className="ecg-controls">
        {!playing && frac < 1 && (
          <button type="button" className="ecg-opt ecg-play" onClick={onPlayClick}>
            {frac === 0 ? (hasAudio ? 'Play with narration' : 'Play') : 'Resume'}
          </button>
        )}
        {playing && <button type="button" className="ecg-opt" onClick={onPauseClick}>Pause</button>}
        {frac > 0 && (
          <button type="button" className="ecg-opt" onClick={onRestart}>Restart</button>
        )}
        {hasAudio && (
          <button type="button" className="ecg-opt" onClick={() => setMuted((m) => !m)}>
            {muted ? 'Unmute' : 'Mute'}
          </button>
        )}
        {frac >= 1 && <p className="ecg-after">Replay it, or scroll down to the practice cases.</p>}
      </div>
    </div>
  );
}
