# ECG Sprint 2

An interactive ECG learning app: 12 modules that follow the book *Learn ECG in a Day*
chapter by chapter, each with a narrated animated explainer (voice: Dr. Beat,
Egyptian colloquial Arabic with English medical terms), study points, a clinical
layer, practice cases on programmatic ECG strips, and a cheat sheet. Around the
modules: flashcards, tap-the-finding drills, compare-and-explain drills, axis /
rate / interval drills, a 60-second sprint, a case of the day, a 10-case timed
mock exam, a "fix my misses" queue, and an exam-eve plan with a master cheat sheet.

## Quick start

```bash
npm install
npm run dev        # local dev server with hot reload
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

Requires Node 18 or newer.

## Hosting it yourself

The `dist/` folder is a ready-made static site. It is already built and included
in this package, so you can skip the build step entirely.

- **Netlify**: drag the `dist/` folder onto app.netlify.com/drop. Done.
- **GitHub Pages**: push `dist/` to a repo and enable Pages on it (or use the
  `gh-pages` package: `npx gh-pages -d dist`). The build uses relative paths and
  hash-based routing (`#/m/foundations`), so it works from any subpath with no
  server configuration.
- **Any static host** (Vercel, Cloudflare Pages, S3, your own nginx): upload
  `dist/` as-is. No rewrites needed.

Progress (solved cases, misses) is stored in the browser's localStorage, so it
persists per device with no backend.

## Project structure

```
src/
  main.tsx               entry point
  App.tsx                all pages: module map, module pages, drills, exam, exam-eve
  style.css              app styles (all classes prefixed ecg-)
  platform/
    files.tsx            portable shim replacing the original platform library
    platform.css         base layout styles for the shim
  ecg/
    waveforms.ts         the ECG waveform generator (all strips are drawn in code,
                         deterministic from a seed; no images anywhere)
    ECG.tsx              SVG strip/12-lead rendering and annotation marks
    Explainer.tsx        the narrated animated explainer player
    choreo.ts            per-module animation choreography
    Quiz.tsx             all drill/card components
    content.ts           shared module types and helpers
    DrNabdh.tsx          the Dr. Beat avatar
    modules/mod1..12.ts  one file per module: explainer script steps, study
                         points, clinical layer, cases, cheat sheet
    audio/
      index.ts           lazy per-module audio loader (data URI -> blob URL)
      mod1..12.ts        the narration clips, base64-encoded MP3 (24 kbps mono)
```

## Editing content

- **Text in a module** (explanations, study points, cases, cheat sheets):
  edit `src/ecg/modules/modN.ts`. Everything is plain data; no other file changes.
  Explainer `explainerSteps` carry `at` timestamps (fraction of the clip) that
  sync the text to the audio; adjust them if you rewrite a step.
- **Cases** use `mk(id, stripSpec, questionData)`. The strip spec picks rhythm
  kind, rate, baseline, morphology overrides, leads, seconds, and a seed.
  See existing cases for the vocabulary of rhythm kinds.
- **Drill pages** (sprint, flashcards, exam...) assemble themselves from the
  module data automatically; new cases appear in them with no extra work.

## The narration audio

- `audio-mp3/` (separate zip): the 100 narration clips, one per explainer step,
  `modN-stepK.mp3`, 24 kbps mono 22.05 kHz.
- The app does not read these files at runtime: the same audio is embedded as
  base64 inside `src/ecg/audio/modN.ts` so the whole app ships as static JS with
  zero asset requests.
- `narration-manifests/` holds the exact script text for every clip
  (`ecg-narration-ar-manifest-N.json`), so you can re-voice any module with a
  TTS service and rebuild.
- `scripts/mkaudio.sh` is the packer: give it a module number, the output .ts
  path, and one WAV per step (it re-encodes and base64-embeds them):

  ```bash
  bash scripts/mkaudio.sh 1 src/ecg/audio/mod1.ts mod1-step1.wav mod1-step2.wav ...
  ```

  It needs ffmpeg. Keep the WAV order matching the explainer steps.

## Notes

- All ECG tracings are simulated for teaching; every word is original phrasing,
  not copied from the book.
- The self-hosted build lazy-loads each module's audio on demand, so first load
  is light and audio for a module downloads only when you open it.
