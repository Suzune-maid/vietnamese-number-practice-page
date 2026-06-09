# Vietnamese Number Practice TTS Generation Runbook

> **For Hermes:** Use this document as the source-of-truth runbook before generating any paid/external TTS audio for this project. Do not run real TTS/API generation unless the user explicitly approves that batch.

**Goal:** Generate the final Northern Vietnamese static audio pack for the Vietnamese number-practice GitHub Pages app.

**Architecture:** The site must stay API-key-free in the browser. Audio is generated offline with OpenRouter Gemini TTS, validated locally, committed as static WAV assets, and referenced from `audio/manifest.json`. The final production strategy is the B plan: compose numbers from reusable chunks instead of generating every full number.

**Tech Stack:** Vanilla JS static site, Node native tests (`node --test` / `npm test`), OpenRouter Gemini TTS via `/home/atmjin/.hermes/archive/github/gemini-tts-cli`, WAV output from PCM, GitHub Pages static assets.

---

## 1. Current state

- Live repo: `https://github.com/Suzune-maid/vietnamese-number-practice-page`
- Live site: `https://suzune-maid.github.io/vietnamese-number-practice-page/`
- Static-site repo path: `/home/atmjin/.hermes/archive/github/vietnamese-number-practice-page`
- TTS CLI repo path: `/home/atmjin/.hermes/archive/github/gemini-tts-cli`
- Current committed audio before the Phase 7 pack:
  - `audio/northern-explicit/0.wav` through `audio/northern-explicit/10.wav` are the smoke pack.
  - `audio/manifest.json` kept those 11 full-number compatibility entries.
- Deployed Phase 7 production pack, originally committed as `015012b` and later published to GitHub Pages:
  - `audio/chunks/northern/` contains the full B-plan Northern chunk set: 1,117 WAV files.
  - `audio/manifest.json` contains 11 full-number compatibility entries plus 1,117 chunk entries with duration, size, and sha256 metadata.
  - Verification baseline: `npm test` = 66/66, WAV/manifest deterministic check = 1,117/1,117 valid, Codex pre-commit review = PASS, live GitHub Pages manifest = 1,117 chunk entries with representative WAV assets returning HTTP 200.
- Current production target:
  - Northern Vietnamese only.
  - Southern Vietnamese audio is interface-reserved, not generated yet.
  - Browser loads checked-in static assets only; no runtime TTS calls.

## 2. Final audio scope

The final Northern B-plan pack contains **1,117 unique chunks**:

- `under-1000`: 1,000 clips
  - Values: `0` through `999`
  - Path: `audio/chunks/northern/under-1000/<value>.wav`
  - Text: `numberToVietnamese(value, { variant: northern })`
- `thousand-prefix`: 9 clips
  - Values: `1` through `9`
  - Path: `audio/chunks/northern/thousand-prefix/<value>.wav`
  - Text examples: `một nghìn`, `hai nghìn`, …, `chín nghìn`
- `explicit-low-remainder`: 99 clips
  - Values: `1` through `99`
  - Path: `audio/chunks/northern/explicit-low-remainder/<value>.wav`
  - Text examples:
    - `1` → `không trăm lẻ một`
    - `26` → `không trăm hai mươi sáu`
    - `99` → `không trăm chín mươi chín`
- `compact-low-digit`: 9 clips
  - Values: `1` through `9`
  - Path: `audio/chunks/northern/compact-low-digit/<value>.wav`
  - Text examples: `lẻ một`, `lẻ hai`, …, `lẻ chín`

Computed baseline from current source code:

```json
{
  "totalUniqueNorthernChunks": 1117,
  "byKind": {
    "northern/under-1000": 1000,
    "northern/thousand-prefix": 9,
    "northern/explicit-low-remainder": 99,
    "northern/compact-low-digit": 9
  },
  "compactDifferent": 891,
  "compactSame": 8109,
  "estimatedCostUsdAt00006385PerClip": 0.7132,
  "estimatedCostUsdWith30PercentBuffer": 0.9272,
  "observedCostUsdAt0001806PerClip": 2.0173
}
```

Actual Phase 7 run note: the first 843 clips consumed about `$1.52`, or roughly `$0.001806` per clip, higher than the early estimate. At that observed rate, the full 1,117-clip pack is about `$2.0173`, and the 274-clip resume pass is about `$0.4948`.

Note: the existing `0–10` full-number smoke WAV files are useful as a quality reference, but the chunked production manifest expects paths under `audio/chunks/northern/...`. Prefer regenerating the complete 1,117 chunk pack for consistency unless the user explicitly chooses to copy/reuse the existing smoke files.

## 3. Non-goals for the next audio generation pass

Do **not** do these in the Northern production pass:

- Do not generate Southern Vietnamese audio.
- Do not generate 10,891 full-number clips.
- Do not expose any API key in browser code or checked-in files.
- Do not commit local batch/debug artifacts unless explicitly promoted to documentation.
- Do not push to GitHub Pages without user approval after generation and verification.

## 4. Source-of-truth code paths

These files define the audio contract:

- `src/number-vietnamese.js`
  - Vietnamese number text rules.
- `src/audio-manifest.js`
  - `createChunkSequenceForQuestion(question)` defines chunk routing.
  - `createAudioChunkEntry(...)` defines manifest chunk shape.
  - `expectedAudioChunkPath(...)` defines runtime file paths.
- `src/audio-player.js`
  - Sequential playback waits for each `ended` event.
- `src/app.js`
  - UI asks `findAudioEntryForQuestion(...)` for either full entries or chunk sequences.
- `tests/audio-sequence.test.js`
  - Regression coverage for chunk routing and safe-path lookup.
- `tests/audio-player.test.js`
  - Regression coverage for completion/cancellation semantics.
- `tests/audio-assets.test.js`
  - Production manifest/audio validation for committed assets.

## 5. Files that still need to be added before full generation

### 5.1 Chunk batch generator

Create:

- `scripts/prepare-tts-chunk-batches.js`
- `src/tts-chunk-batch.js`
- `tests/tts-chunk-batch.test.js`

Expected behavior:

- Generate one JSONL batch per chunk kind.
- Each JSONL record must have at least:

```json
{"id":"26","text":"không trăm hai mươi sáu"}
```

- Use numeric `id` inside each kind-specific output directory so `gemini-tts-cli` produces `<value>.wav` directly.
- Default output directory for local batch specs:

```text
tmp/tts-batches/chunks/northern/<kind>.jsonl
```

- Do not put paid-generation JSONL files under `audio/` unless they are intended to be public artifacts. Prefer `tmp/` or another ignored local-only path.

Suggested CLI shape:

```bash
node scripts/prepare-tts-chunk-batches.js \
  --accent=northern \
  --output-dir=tmp/tts-batches/chunks/northern
```

Expected output files:

```text
tmp/tts-batches/chunks/northern/under-1000.jsonl             # 1000 records
tmp/tts-batches/chunks/northern/thousand-prefix.jsonl        # 9 records
tmp/tts-batches/chunks/northern/explicit-low-remainder.jsonl # 99 records
tmp/tts-batches/chunks/northern/compact-low-digit.jsonl      # 9 records
```

### 5.2 Manifest builder

Create:

- `scripts/build-audio-manifest.js`
- `tests/audio-manifest-build.test.js` or extend `tests/audio-assets.test.js`

Expected behavior:

- Read validated files under `audio/chunks/northern/**/<value>.wav`.
- Compute:
  - file size
  - SHA-256
  - WAV metadata / duration
- Write or update `audio/manifest.json` with:
  - existing full-number `entries` preserved unless intentionally replaced
  - new `chunks` array added
  - `generatedAt`
  - `generator`
  - `style`
  - `schemaVersion`

Required chunk entry shape:

```json
{
  "id": "northern-explicit-low-remainder-26",
  "accent": "northern",
  "kind": "explicit-low-remainder",
  "value": 26,
  "dialect": "Northern Vietnamese",
  "text": "không trăm hai mươi sáu",
  "file": "audio/chunks/northern/explicit-low-remainder/26.wav",
  "format": "wav",
  "durationSeconds": 1.23,
  "sha256": "...64 hex chars..."
}
```

### 5.3 Ignore local generation artifacts

Ensure `.gitignore` covers local-only artifacts, for example:

```gitignore
tmp/
audio/tts-batches/
audio/tts-reports/
audio/tts-debug/
```

Before commit, verify with:

```bash
git status --short
git diff --cached --name-only | grep -E 'tts-batches|tts-reports|tts-debug|tmp/' || true
```

Only runtime assets and durable docs should be staged.

## 6. Recommended generation order

### Phase A — tooling only, no paid TTS

1. Add chunk batch generator.
2. Add manifest builder.
3. Add tests for:
   - exact counts: `1000 + 9 + 99 + 9 = 1117`
   - representative transcripts:
     - `under-1000/0` → `không`
     - `under-1000/105` → `một trăm lẻ năm`
     - `thousand-prefix/2` → `hai nghìn`
     - `explicit-low-remainder/26` → `không trăm hai mươi sáu`
     - `compact-low-digit/5` → `lẻ năm`
   - path shape exactly matches `audio/chunks/northern/<kind>/<value>.wav`
4. Run:

```bash
npm test
```

Expected: all tests pass.

### Phase B — small sample batch, requires explicit approval

Generate a small sample before paying for all 1,117 clips.

Suggested sample set:

```text
under-1000: 0, 1, 5, 10, 11, 15, 21, 25, 99, 105, 115, 999
thousand-prefix: 1, 2, 9
explicit-low-remainder: 1, 5, 26, 99
compact-low-digit: 1, 5, 9
```

Purpose:

- Confirm Northern accent is acceptable.
- Confirm pacing is slow enough for beginner listening.
- Confirm no truncation or missing words.
- Confirm seams are tolerable for representative composed values.

After sample generation:

1. Validate WAVs automatically.
2. Spot-listen samples manually.
3. Browser-smoke representative composed values such as:
   - `2026` explicit → `hai nghìn` + `không trăm hai mươi sáu`
   - `1005` compact → `một nghìn` + `lẻ năm`
   - `9999` explicit / compact route as expected

### Phase C — full Northern chunk pack, requires explicit approval

Run four kind-specific batches:

```bash
cd /home/atmjin/.hermes/archive/github/gemini-tts-cli

uv run gemini-tts \
  --batch-jsonl /home/atmjin/.hermes/archive/github/vietnamese-number-practice-page/tmp/tts-batches/chunks/northern/under-1000.jsonl \
  --output-dir /home/atmjin/.hermes/archive/github/vietnamese-number-practice-page/audio/chunks/northern/under-1000 \
  --response-format pcm \
  --style "Natural Northern Vietnamese pronunciation. Clear, friendly, medium-slow pace for a beginner language learner. Read the number exactly once." \
  --summary-json /home/atmjin/.hermes/archive/github/vietnamese-number-practice-page/tmp/tts-reports/chunks/northern/under-1000-summary.json \
  --save-debug-json /home/atmjin/.hermes/archive/github/vietnamese-number-practice-page/tmp/tts-debug/chunks/northern/under-1000-debug.json \
  --retry 2 \
  --retry-on-invalid-audio
```

Repeat with the appropriate JSONL and output directory for:

- `thousand-prefix`
- `explicit-low-remainder`
- `compact-low-digit`

Important:

- Use `--response-format pcm`; current OpenRouter Gemini TTS rejects `mp3` for this model.
- The CLI writes `.wav` files when response format is `pcm`.
- If failures occur, do not rerun successful files blindly. Retry only missing/invalid records.

### Phase D — manifest and app verification

1. Build/refresh manifest:

```bash
cd /home/atmjin/.hermes/archive/github/vietnamese-number-practice-page
node scripts/build-audio-manifest.js
```

2. Run automated validation:

```bash
npm test
```

3. Start local server:

```bash
python3 -m http.server 4173
```

4. Browser-smoke:

- No console errors.
- Playback button appears for all generated values.
- `看數字選越南語` selected-option playback works.
- `聽聲音選阿拉伯數字` selected-option playback works.
- Listening mode no longer falls back to answer text for covered values.
- Composed chunk playback order is correct for representative values.

5. Stop local server.

### Phase E — review, commit, and deploy

1. Run Codex pre-commit review.
2. Stage intentionally:

```bash
git add \
  audio/manifest.json \
  audio/chunks/northern \
  src \
  scripts \
  tests \
  README.md \
  docs
```

3. Inspect staged files:

```bash
git diff --cached --stat
git diff --cached --name-only | grep -E 'tmp/|tts-batches|tts-reports|tts-debug' && echo "Unexpected generation artifact staged" || true
```

4. Commit locally.
5. Push only after explicit user approval.
6. After push, poll GitHub Pages until:
   - `gh api repos/Suzune-maid/vietnamese-number-practice-page/pages --jq '.status'` is `built`
   - live `audio/manifest.json` includes `chunks`
   - representative live WAV URLs return HTTP 200
   - live browser smoke passes

## 7. OpenRouter key preflight

Before any paid batch, verify the key exists without printing the secret:

```bash
cd /home/atmjin/.hermes/archive/github/gemini-tts-cli
python3 - <<'PY'
from pathlib import Path
p = Path('.env')
print('file', p, 'exists=', p.exists())
if p.exists():
    for line in p.read_text(encoding='utf-8', errors='replace').splitlines():
        s = line.strip()
        if s.startswith('OPENROUTER_API_KEY='):
            v = s.split('=', 1)[1].strip().strip('"\'')
            print('OPENROUTER_API_KEY present=', bool(v), 'len=', len(v))
PY
```

If checking `/auth/key`, redact the token from all output. Stop immediately on HTTP 401 or `User not found`.

## 8. WAV validation rules

Every generated WAV must satisfy:

- file exists
- size `> 44` bytes
- valid RIFF/WAVE header
- frame count `> 0`
- duration seconds `> 0`
- SHA-256 recorded in manifest
- manifest path is same-origin and exactly expected:
  - `audio/chunks/northern/<kind>/<value>.wav`

Do not add invalid/header-only WAV files to `audio/manifest.json`.

## 9. Failure handling

If a batch has failures:

1. Parse summary/debug JSON.
2. Identify only missing or invalid outputs.
3. Retry failed records one-by-one or in a small retry JSONL.
4. Try shortened style first if the issue is empty/invalid audio.
5. If a line truncates, keep the same transcript but simplify style before changing text.
6. If text must change, update both the source transcript generation and manifest expectations; do not let audio and transcript drift.
7. Do not declare completion until every expected chunk has a validated WAV and manifest entry.

## 10. Human listening checklist

Spot-listen at least these clips before approving the full pack:

- `audio/chunks/northern/under-1000/0.wav`
- `audio/chunks/northern/under-1000/5.wav`
- `audio/chunks/northern/under-1000/15.wav`
- `audio/chunks/northern/under-1000/21.wav`
- `audio/chunks/northern/under-1000/105.wav`
- `audio/chunks/northern/under-1000/999.wav`
- `audio/chunks/northern/thousand-prefix/2.wav`
- `audio/chunks/northern/explicit-low-remainder/26.wav`
- `audio/chunks/northern/compact-low-digit/5.wav`

Check:

- Northern pronunciation is acceptable.
- `nghìn`, `lẻ`, `mốt`, `lăm` are audible and correct.
- No repeated number, truncation, or trailing unrelated speech.
- Pace is beginner-friendly.
- Volume is not wildly inconsistent.

## 11. Representative composed playback checks

After manifest build, browser-smoke these values:

- `2026 / northern-explicit`
  - Expected files:
    - `audio/chunks/northern/thousand-prefix/2.wav`
    - `audio/chunks/northern/explicit-low-remainder/26.wav`
- `2026 / northern-compact`
  - Expected files:
    - `audio/chunks/northern/thousand-prefix/2.wav`
    - `audio/chunks/northern/under-1000/26.wav`
- `1005 / northern-compact`
  - Expected files:
    - `audio/chunks/northern/thousand-prefix/1.wav`
    - `audio/chunks/northern/compact-low-digit/5.wav`
- `9999 / northern-explicit`
  - Expected files:
    - `audio/chunks/northern/thousand-prefix/9.wav`
    - `audio/chunks/northern/under-1000/999.wav`

## 12. Acceptance criteria for “audio generation complete”

The Northern B-plan audio generation is complete only when all are true:

- `audio/chunks/northern/under-1000` has 1,000 validated WAVs.
- `audio/chunks/northern/thousand-prefix` has 9 validated WAVs.
- `audio/chunks/northern/explicit-low-remainder` has 99 validated WAVs.
- `audio/chunks/northern/compact-low-digit` has 9 validated WAVs.
- `audio/manifest.json` has a `chunks` array with 1,117 Northern entries.
- `npm test` passes.
- Local browser smoke passes.
- Codex pre-commit review passes.
- Staged files exclude local-only generation artifacts.
- User approves push.
- GitHub Pages live verification passes after push.

## 13. Future Southern audio plan

Southern audio should be a separate future pass, not mixed into Northern generation.

When requested:

- Add `southern` chunk batch generation.
- Use paths:

```text
audio/chunks/southern/under-1000/<value>.wav
audio/chunks/southern/thousand-prefix/<value>.wav
audio/chunks/southern/explicit-low-remainder/<value>.wav
audio/chunks/southern/compact-low-digit/<value>.wav
```

- Treat accent control as best-effort and require human sample listening before full generation.
- Decide explicitly whether Southern text should use `ngàn` only, or also other regional wording changes.

## 14. Quick operator checklist

Before paid generation:

- [ ] User explicitly approved the batch.
- [ ] `git status --short --branch` is clean or known.
- [ ] OpenRouter key preflight passed.
- [ ] Batch JSONL counts match expected scope.
- [ ] Output directories are correct and under `audio/chunks/northern/...`.
- [ ] `tmp/` or report/debug paths are ignored or intentionally unstaged.

After generation:

- [ ] WAV validation passed.
- [ ] Manifest rebuilt.
- [ ] `npm test` passed.
- [ ] Browser smoke passed.
- [ ] Codex review passed.
- [ ] Commit made locally.
- [ ] Push only after explicit approval.
