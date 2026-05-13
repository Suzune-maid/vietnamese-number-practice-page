#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

import { createTtsBatchRecords, geminiVietnameseStyle } from '../src/tts-batch.js';

function parseArgs(argv) {
  const args = {
    min: 0,
    max: 9999,
    audioStyle: 'northern-explicit',
    output: null,
  };

  for (const arg of argv) {
    const [key, value] = arg.split('=', 2);
    if (key === '--min') args.min = Number.parseInt(value, 10);
    if (key === '--max') args.max = Number.parseInt(value, 10);
    if (key === '--audio-style') args.audioStyle = value;
    if (key === '--output') args.output = value;
  }

  if (!args.output) {
    args.output = `audio/tts-batches/${args.audioStyle}-${args.min}-${args.max}.jsonl`;
  }

  return args;
}

const args = parseArgs(process.argv.slice(2));
const records = createTtsBatchRecords(args);
const outputPath = path.resolve(process.cwd(), args.output);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${records.map((record) => JSON.stringify(record)).join('\n')}\n`, 'utf8');

console.log(`Wrote ${records.length} records to ${path.relative(process.cwd(), outputPath)}`);
console.log(`Suggested style: ${geminiVietnameseStyle}`);
console.log(`Suggested output dir: audio/${args.audioStyle}`);
