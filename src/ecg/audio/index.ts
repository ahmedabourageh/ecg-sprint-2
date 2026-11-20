import { ExplainAudio } from '../Explainer';

// Convert a data: URI to a blob: URL. iOS Safari and in-app webviews refuse
// to play data: audio, while blob: URLs play everywhere.
function dataToBlobUrl(dataUri: string): string {
  const comma = dataUri.indexOf(',');
  const head = dataUri.slice(0, comma);
  const b64 = dataUri.slice(comma + 1);
  const mime = /data:(.*?);base64/.exec(head)?.[1] || 'audio/mpeg';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

function toBlobAudio(a: ExplainAudio): ExplainAudio {
  return { secs: a.secs, uris: a.uris.map(dataToBlobUrl) };
}

// Lazy registry for explainer voiceover. Cases are added as narration
// clips land for each module; modules without audio run in timed mode.
export async function loadAudio(id: string): Promise<ExplainAudio | undefined> {
  switch (id) {
    case 'foundations': return toBlobAudio((await import('./mod1')).audio);
    case 'normal-ecg': return toBlobAudio((await import('./mod2')).audio);
    case 'systematic-reading': return toBlobAudio((await import('./mod3')).audio);
    case 'atria-pr': return toBlobAudio((await import('./mod4')).audio);
    case 'ischemia-mi': return toBlobAudio((await import('./mod5')).audio);
    case 'hypertrophy-bbb': return toBlobAudio((await import('./mod6')).audio);
    case 'arrhythmias-1': return toBlobAudio((await import('./mod7')).audio);
    case 'arrhythmias-2': return toBlobAudio((await import('./mod8')).audio);
    case 'arrhythmia-drills': return toBlobAudio((await import('./mod9')).audio);
    case 'ddx': return toBlobAudio((await import('./mod10')).audio);
    case 'pediatric': return toBlobAudio((await import('./mod11')).audio);
    case 'final-mode': return toBlobAudio((await import('./mod12')).audio);
    default:
      return undefined;
  }
}

