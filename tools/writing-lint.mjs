#!/usr/bin/env node
// writing-lint.mjs: the house style, checked by machine.
//
// Usage: node tools/writing-lint.mjs <file> [<file> ...]
//
// Reads HTML or Markdown, keeps only the text a reader sees (script, style and
// code blocks are dropped, tags are stripped) and reports every line that breaks
// a rule from WRITING.md or the vocabulary budget. Exit code 1 on any finding,
// 0 when clean. Each finding prints as file:line: rule: the offending text.
//
// Rules, in the order WRITING.md states them:
//   em-dash        no em dashes in anything a reader reads (en dash only inside
//                  numeric ranges such as 13–17; a spaced en dash is an em dash
//                  in disguise and is reported too)
//   fourth-wall    the banned constructions from "Never break the fourth wall"
//   throat-clear   the openers and connectives from "My tics"
//   vocabulary     retired nouns from "The vocabulary budget" (lantern, sigil,
//                  sounding) and `mansion`, which a visitor never reads: the
//                  word is `station` (STARSHARD-LAUNCH.md §2.2)
//   prophecy       "you will" (the Build Plan copy law: counsel, never prophecy)
//
// The lint is deliberately dumb: regular expressions over visible text, one
// line at a time. It will not catch a paragraph that frames before it shows.
// That is still a human's job. It will catch the things that have shipped
// before and should not ship again.

import { readFileSync } from 'node:fs';

const RULES = [
  { id: 'em-dash', re: /—|\s–\s|\s--\s/g, why: 'no em dashes: colon, period or comma pair' },
  { id: 'fourth-wall', re: /\bwe (compute|don't guess|do not guess|won't fake|will not fake|say so)\b/gi, why: 'the product never narrates its own method' },
  { id: 'fourth-wall', re: /\b(isn't|is not) a (trick|label we picked|photograph)\b/gi, why: 'defending the reading instead of giving it' },
  { id: 'fourth-wall', re: /\bbuilt on trust\b|\btrusted partners?\b/gi, why: 'product marketing inside the experience' },
  { id: 'throat-clear', re: /\bhere's the part\b|\bworth knowing\b|\bwhich is what makes\b|\bthat's why\b|\bwhich means\b/gi, why: 'announcing or explaining instead of showing' },
  { id: 'vocabulary', re: /\bmansions?\b/gi, why: 'a visitor reads "station", never "mansion"' },
  { id: 'vocabulary', re: /\b(the )?(lantern|sounding)s?\b/gi, why: 'retired noun: say the moon, or tonight' },
  { id: 'vocabulary', re: /\bsigils?\b/gi, why: 'retired noun: say your chart' },
  { id: 'prophecy', re: /\byou will\b/gi, why: 'no prophecy: counsel, tendency, conduct' },
];

// Everything inside these elements is not read by a visitor.
const DROP_BLOCKS = /<(script|style|code|pre)\b[\s\S]*?<\/\1>/gi;

function visibleLines(source, isHtml) {
  // Replace dropped blocks with the same number of newlines so line numbers hold.
  let text = source.replace(DROP_BLOCKS, m => m.replace(/[^\n]/g, ''));
  if (isHtml) {
    text = text.replace(/<!--[\s\S]*?-->/g, m => m.replace(/[^\n]/g, ''));
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
  } else {
    // Markdown: fenced code blocks are already dropped by DROP_BLOCKS only in HTML;
    // handle ``` fences here, keeping line count.
    text = text.replace(/```[\s\S]*?```/g, m => m.replace(/[^\n]/g, ''));
    text = text.replace(/`[^`\n]*`/g, ' ');
  }
  return text.split('\n');
}

function lintFile(file) {
  const source = readFileSync(file, 'utf8');
  const isHtml = /\.html?$/i.test(file);
  const lines = visibleLines(source, isHtml);
  const findings = [];
  lines.forEach((line, i) => {
    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(line)) !== null) {
        const start = Math.max(0, m.index - 30);
        const excerpt = line.slice(start, m.index + m[0].length + 30).trim();
        findings.push(`${file}:${i + 1}: ${rule.id}: "${excerpt}" (${rule.why})`);
        if (m[0].length === 0) rule.re.lastIndex++;
      }
    }
  });
  return findings;
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node tools/writing-lint.mjs <file> [<file> ...]');
  process.exit(2);
}

let total = 0;
for (const file of files) {
  const findings = lintFile(file);
  total += findings.length;
  for (const f of findings) console.log(f);
  console.log(`# ${file}: ${findings.length === 0 ? 'clean' : findings.length + ' finding(s)'}`);
}
process.exit(total === 0 ? 0 : 1);
