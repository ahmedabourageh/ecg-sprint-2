import { StepChoreo } from './Explainer';

// Motion-graphics choreography per module, parallel to each module's explainerSteps.
// cam: stage fractions (x, y) + zoom. Multi-lead stages use a 4-column grid, so
// lead i sits at x=(i%4+0.5)/4, y=(floor(i/4)+0.5)/rows. Marks: t in seconds
// along that lead's strip, amp in mm above/below baseline. Beat phase is
// deterministic: P at 0.06 + k*RR, QRS at P + pr + 0.06.

const cell = (i: number, rows: number) => ({ x: ((i % 4) + 0.5) / 4, y: (Math.floor(i / 4) + 0.5) / rows });

export const choreo: Record<string, StepChoreo[]> = {
  foundations: [
    { cam: { x: 0.06, y: 0.5, z: 2.0 }, marks: [{ lead: 0, kind: 'ring', t0: 0.0, t1: 0.3, amp: 1.5, tall: 4, label: 'the spark' }] },
    { cam: { x: 0.08, y: 0.5, z: 2.0 }, marks: [
      { lead: 0, kind: 'ring', t0: 0.0, t1: 0.3, amp: 1.5, tall: 4, label: 'P wave' },
      { lead: 0, kind: 'ring', t0: 0.83, t1: 1.13, amp: 1.5, tall: 4 },
    ] },
    { cam: { x: 0.16, y: 0.55, z: 2.0 }, marks: [{ lead: 0, kind: 'caliper', t0: 0.06, t1: 0.28, amp: -4, label: 'the AV pause' }] },
    { cam: { x: 0.28, y: 0.45, z: 1.6 }, marks: [{ lead: 0, kind: 'arrow', t0: 0.28, amp: 10, label: 'QRS' }] },
    { cam: { x: 0.3, y: 0.5, z: 1.6 }, marks: [
      { lead: 0, kind: 'arrow', t0: 0.28, amp: 10, label: 'toward: up' },
      { lead: 0, kind: 'line', t0: 0.5, t1: 1.4, amp: 0, label: 'baseline' },
    ] },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.18, y: 0.5, z: 1.7 }, marks: [{ lead: 0, kind: 'ring', t0: 0.86, t1: 1.16, amp: 1.5, tall: 4, label: 'P on time' }] },
  ],
  'normal-ecg': [
    { cam: { ...cell(1, 3), z: 2.2 }, marks: [{ lead: 1, kind: 'ring', t0: 0.0, t1: 0.3, amp: 1.5, tall: 4, label: 'P < 0.12 s' }] },
    { cam: { ...cell(1, 3), z: 2.2 }, marks: [{ lead: 1, kind: 'caliper', t0: 0.06, t1: 0.28, amp: -4, label: 'PR 3-5 boxes' }] },
    { cam: { ...cell(1, 3), z: 2.2 }, marks: [{ lead: 1, kind: 'ring', t0: 0.2, t1: 0.42, amp: 3, tall: 10, label: 'QRS < 0.12 s' }] },
    { cam: { x: 0.6, y: 0.68, z: 1.4 }, marks: [
      { lead: 6, kind: 'arrow', t0: 0.36, amp: -7, label: 'small r, deep S' },
      { lead: 10, kind: 'arrow', t0: 0.3, amp: 11, label: 'tall R' },
    ] },
    { cam: { ...cell(1, 3), z: 2.2 }, marks: [{ lead: 1, kind: 'line', t0: 0.4, t1: 0.62, amp: 0, label: 'ST on the line' }] },
    { cam: { ...cell(1, 3), z: 2.2 }, marks: [
      { lead: 1, kind: 'ring', t0: 0.45, t1: 0.72, amp: 2.5, tall: 5, label: 'T' },
      { lead: 1, kind: 'caliper', t0: 0.28, t1: 0.7, amp: -6, label: 'QT' },
    ] },
    { cam: { ...cell(3, 3), z: 2.2 }, marks: [{ lead: 3, kind: 'ring', t0: 0.15, t1: 0.55, amp: -3, tall: 6, label: 'aVR flipped' }] },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: ((1 % 4) + 0.5) / 4, y: 0.5 / 3, z: 1.8 }, marks: [{ lead: 1, kind: 'ring', t0: 0.4, t1: 0.7, amp: 2.5, tall: 5, label: 'upright T' }] },
  ],
  'systematic-reading': [
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.25, y: 0.25, z: 1.8 }, marks: [{ lead: 0, kind: 'boxes', t0: 0, count: 5, label: '25 mm every second' }] },
    { cam: { x: 0.75, y: 0.25, z: 2.0 }, marks: [{ lead: 1, kind: 'boxes', t0: 0.28, count: 4, label: '4 boxes = 300/4 = 75' }] },
    { cam: { x: 0.75, y: 0.25, z: 1.9 }, marks: [
      { lead: 1, kind: 'caliper', t0: 0.28, t1: 1.08, amp: 8, label: 'RR' },
      { lead: 1, kind: 'caliper', t0: 1.08, t1: 1.88, amp: 8 },
    ] },
    { cam: { x: 0.25, y: 0.5, z: 1.6 }, marks: [
      { lead: 0, kind: 'arrow', t0: 0.28, amp: 9, label: 'I +' },
      { lead: 2, kind: 'arrow', t0: 0.28, amp: 9, label: 'aVF +' },
    ] },
    { cam: { x: 0.75, y: 0.25, z: 1.9 }, marks: [
      { lead: 1, kind: 'ring', t0: 0.0, t1: 0.3, amp: 1.5, tall: 4, label: 'P' },
      { lead: 1, kind: 'caliper', t0: 0.06, t1: 0.28, amp: -4, label: 'PR' },
      { lead: 1, kind: 'ring', t0: 0.2, t1: 0.42, amp: 3, tall: 10, label: 'QRS' },
    ] },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.75, y: 0.25, z: 1.7 }, marks: [{ lead: 1, kind: 'ring', t0: 0.4, t1: 0.75, amp: 2.5, tall: 6, label: 'peaked T' }] },
  ],
  'atria-pr': [
    { cam: { x: 0.5, y: 0.5, z: 1.2 } },
    { cam: { x: 0.05, y: 0.5, z: 2.0 }, marks: [{ lead: 0, kind: 'ring', t0: 0.0, t1: 0.32, amp: 1.8, tall: 5, label: 'read the P shape' }] },
    { cam: { x: 0.1, y: 0.55, z: 1.9 }, marks: [{ lead: 0, kind: 'caliper', t0: 0.06, t1: 0.34, amp: -4, label: 'PR grows...' }] },
    { cam: { x: 0.5, y: 0.5, z: 1.2 } },
    { cam: { x: 0.5, y: 0.5, z: 1.2 } },
    { cam: { x: 0.5, y: 0.5, z: 1.2 } },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.2, y: 0.5, z: 1.6 }, marks: [{ lead: 0, kind: 'caliper', t0: 0.06, t1: 0.28, amp: -4, label: 'PR stretches' }] },
  ],
  'ischemia-mi': [
    { cam: { x: 0.6, y: 0.68, z: 1.5 }, marks: [{ lead: 8, kind: 'ring', t0: 0.3, t1: 0.55, amp: 4, tall: 5, label: 'ST up' }] },
    { cam: { ...cell(8, 3), z: 2.2 }, marks: [
      { lead: 8, kind: 'line', t0: 0.05, t1: 0.28, amp: 0, label: 'baseline' },
      { lead: 8, kind: 'arrow', t0: 0.42, amp: 4.5, label: '1 mm+' },
    ] },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.15, y: 0.35, z: 1.9 }, marks: [
      { lead: 0, kind: 'arrow', t0: 0.42, amp: -3, label: 'mirror' },
      { lead: 4, kind: 'arrow', t0: 0.42, amp: -3 },
    ] },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.625, y: 0.5, z: 1.8 }, marks: [{ lead: 7, kind: 'arrow', t0: 0.3, amp: 6, label: 'ST up' }] },
  ],
  'hypertrophy-bbb': [
    { cam: { ...cell(6, 3), z: 2.4 }, marks: [{ lead: 6, kind: 'ring', t0: 0.18, t1: 0.5, amp: 5, tall: 9, label: 'rabbit ears' }] },
    { cam: { ...cell(6, 3), z: 2.4 }, marks: [{ lead: 6, kind: 'caliper', t0: 0.22, t1: 0.46, amp: -7, label: 'QRS 0.12 s+' }] },
    { cam: { ...cell(11, 3), z: 2.4 }, marks: [{ lead: 11, kind: 'ring', t0: 0.3, t1: 0.52, amp: -3, tall: 5, label: 'wide S' }] },
    { cam: { x: 0.6, y: 0.66, z: 1.5 }, marks: [
      { lead: 6, kind: 'ring', t0: 0.2, t1: 0.5, amp: -6, tall: 7, label: 'LBBB: deep V1' },
      { lead: 11, kind: 'ring', t0: 0.2, t1: 0.55, amp: 8, tall: 7, label: 'broad V6' },
    ] },
    { cam: { x: 0.5, y: 0.5, z: 1.2 } },
    { cam: { x: 0.5, y: 0.5, z: 1.2 } },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.125, y: 0.5, z: 1.9 }, marks: [{ lead: 4, kind: 'ring', t0: 0.2, t1: 0.45, amp: 3, tall: 10, label: 'rabbit ears' }] },
  ],
  'arrhythmias-1': [
    { cam: { x: 0.3, y: 0.5, z: 1.5 }, marks: [
      { lead: 0, kind: 'ring', t0: 0.05, t1: 0.45, amp: 3, tall: 9, label: 'normal' },
      { lead: 0, kind: 'ring', t0: 0.5, t1: 0.95, amp: 2, tall: 10, label: 'early' },
    ] },
    { cam: { x: 0.7, y: 0.5, z: 2.0 }, marks: [{ lead: 0, kind: 'arrow', t0: 0.68, amp: 9, label: 'wide, no P' }] },
    { cam: { x: 0.75, y: 0.55, z: 1.8 }, marks: [{ lead: 0, kind: 'caliper', t0: 0.68, t1: 1.75, amp: -6, label: 'the pause' }] },
    { cam: { x: 0.5, y: 0.5, z: 1.2 } },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.3, y: 0.5, z: 1.7 }, marks: [{ lead: 0, kind: 'boxes', t0: 0.28, count: 4, label: 'about 4 boxes' }] },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.5, y: 0.5, z: 1.2 } },
  ],
  'arrhythmias-2': [
    { cam: { x: 0.35, y: 0.55, z: 1.6 }, marks: [
      { lead: 0, kind: 'line', t0: 0, t1: 2.2, amp: -1, label: 'quivering baseline' },
      { lead: 0, kind: 'caliper', t0: 0.1, t1: 0.9, amp: 8, label: 'never the same' },
    ] },
    { cam: { x: 0.5, y: 0.5, z: 1.2 } },
    { cam: { x: 0.5, y: 0.5, z: 1.2 } },
    { cam: { x: 0.5, y: 0.5, z: 1.2 } },
    { cam: { x: 0.5, y: 0.5, z: 1.2 } },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.5, y: 0.5, z: 1.2 } },
  ],
  'arrhythmia-drills': [
    { cam: { x: 0.5, y: 0.5, z: 1.3 } },
    { cam: { x: 0.2, y: 0.5, z: 1.9 }, marks: [{ lead: 0, kind: 'boxes', t0: 0.12, count: 2, label: 'under 2 boxes = fast' }] },
    { cam: { x: 0.1, y: 0.5, z: 2.0 }, marks: [{ lead: 0, kind: 'ring', t0: 0.0, t1: 0.22, amp: 1, tall: 4, label: 'no P here' }] },
    { cam: { x: 0.15, y: 0.55, z: 2.0 }, marks: [{ lead: 0, kind: 'caliper', t0: 0.12, t1: 0.22, amp: -5, label: 'narrow' }] },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.5, y: 0.5, z: 1.2 } },
  ],

  ddx: [
    { cam: { x: 0.3, y: 0.5, z: 1.2 } },
    { cam: { x: 0.1, y: 0.55, z: 2.0 }, marks: [{ lead: 0, kind: 'ring', t0: 0.0, t1: 0.3, amp: 1.5, tall: 5, label: 'P: tall? wide? flipped? absent?' }] },
    { cam: { x: 0.14, y: 0.5, z: 2.0 }, marks: [{ lead: 0, kind: 'caliper', t0: 0.06, t1: 0.28, amp: -4, label: 'PR: long, short, variable' }] },
    { cam: { x: 0.3, y: 0.5, z: 1.9 }, marks: [{ lead: 0, kind: 'ring', t0: 0.2, t1: 0.42, amp: 3, tall: 11, label: 'QRS: wide? small?' }] },
    { cam: { x: 0.42, y: 0.5, z: 1.9 }, marks: [
      { lead: 0, kind: 'line', t0: 0.4, t1: 0.6, amp: 0, label: 'ST: up or down' },
      { lead: 0, kind: 'ring', t0: 0.45, t1: 0.7, amp: 2.5, tall: 5, label: 'T: peaked or flat' },
    ] },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.15, y: 0.5, z: 1.8 }, marks: [{ lead: 0, kind: 'ring', t0: 0.45, t1: 0.75, amp: 2, tall: 5, label: 'peaked T' }] },
  ],
  pediatric: [
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { ...cell(1, 3), z: 1.8 }, marks: [{ lead: 1, kind: 'caliper', t0: 0.1, t1: 0.56, amp: 8, label: '140: resting for a baby' }] },
    { cam: { ...cell(6, 3), z: 2.0 }, marks: [{ lead: 6, kind: 'arrow', t0: 0.32, amp: 12, label: 'big R in V1: normal' }] },
    { cam: { ...cell(7, 3), z: 2.0 }, marks: [{ lead: 7, kind: 'ring', t0: 0.5, t1: 0.8, amp: -2.5, tall: 5, label: 'juvenile T' }] },
    { cam: { ...cell(1, 3), z: 2.0 }, marks: [{ lead: 1, kind: 'caliper', t0: 0.06, t1: 0.24, amp: -4, label: 'short PR' }] },
    { cam: { x: 0.5, y: 0.5, z: 1.1 } },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.625, y: 0.5, z: 1.8 }, marks: [{ lead: 7, kind: 'ring', t0: 0.4, t1: 0.7, amp: -2, tall: 5, label: 'juvenile T' }] },
  ],
  'final-mode': [
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.5, y: 0.5, z: 1.1 }, marks: [{ lead: 1, kind: 'boxes', t0: 0, count: 3, label: 'always start at the grid' }] },
    { cam: { ...cell(1, 3), z: 1.7 } },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.5, y: 0.5, z: 1 } },
    { cam: { x: 0.625, y: 0.5, z: 1.8 }, marks: [{ lead: 7, kind: 'ring', t0: 0.3, t1: 0.5, amp: 2, tall: 6, label: 'notched J' }] },
  ],
};
