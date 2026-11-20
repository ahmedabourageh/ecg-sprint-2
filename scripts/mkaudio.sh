#!/bin/bash
# usage: mkaudio.sh <module-num> <out-ts> <wav...>  (wavs in step order)
set -e
mod=$1; out=$2; shift 2
uris=(); secs=()
for w in "$@"; do
  mp3="/tmp/$(basename "$w" .wav).mp3"
  ffmpeg -y -v error -i "$w" -codec:a libmp3lame -b:a 24k -ar 22050 -ac 1 "$mp3"
  b64=$(base64 -w0 "$mp3")
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$w")
  uris+=("\"data:audio/mpeg;base64,$b64\"")
  secs+=("$d")
done
{
  echo "import { ExplainAudio } from '../Explainer';"
  echo ""
  echo "// Generated voiceover for module $mod (voice Sadaltager, English narration)."
  echo "export const audio: ExplainAudio = {"
  echo "  uris: ["
  for u in "${uris[@]}"; do echo "    $u,"; done
  echo "  ],"
  echo "  secs: [$(IFS=', '; echo "${secs[*]}")],"
  echo "};"
} > "$out"
echo "wrote $out: $(wc -c < "$out") bytes, ${#uris[@]} clips, secs: ${secs[*]}"
