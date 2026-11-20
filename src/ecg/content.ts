import { CaseSpec, NORMAL, Morph } from './waveforms';
import { ExplainStep, ExplainAudio } from './Explainer';
import { EcgCase } from './Quiz';

export interface TeachCard {
  title: string;   // criteria / concept / cause / clinical features style
  points: string[];
}

export interface Clinical {
  symptoms: string;   // Arabic, symptom picture
  visual: string;     // the memorable image/animation idea shown in the app
  treatment: string;  // "treatment in brief"
}

export interface ModuleDef {
  num: number;
  id: string;
  title: string;
  enTitle: string;
  chapters: string;     // book chapters covered
  tagline: string;
  shipped: boolean;
  explainerSpec?: CaseSpec;
  explainerSteps?: ExplainStep[];
  explainerAudio?: ExplainAudio;
  teach?: TeachCard[];
  clinical?: Clinical;
  cheat?: { label: string; value: string }[];
  cases?: EcgCase[];
  orderQuiz?: { question: string; steps: string[] };
}

export const M = (over: Partial<Morph>): Morph => ({ ...NORMAL, ...over });

export function mk(
  id: string,
  spec: Omit<CaseSpec, 'morph' | 'seed' | 'leads'> & { morph?: Partial<Morph>; seed?: number; leads?: CaseSpec['leads'] },
  q: Omit<EcgCase, 'id' | 'spec'>,
): EcgCase {
  const { morph, seed, leads, ...rest } = spec;
  return {
    id,
    spec: { morph: M(morph ?? {}), seed: seed ?? 7, leads: leads ?? leadII(), ...rest },
    ...q,
  };
}

// One-lead strip helper (lead II rhythm strip is the teaching default).
export const leadII = (label = 'Lead II') => [{ label }];

// Standard 12-lead layout labels in reading order.
export const leads12 = (over: Record<string, Partial<Morph>> = {}) =>
  ['I', 'II', 'III', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6']
    .map((label) => ({ label, morph: over[label] }));
