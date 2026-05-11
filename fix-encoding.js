/**
 * Fix mojibake in JSON flashcard files.
 *
 * Root cause: UTF-8 bytes were decoded as Windows-1252, then stored as UTF-8.
 * Fix: reverse the process — map each character back to its Windows-1252 byte,
 * then decode the resulting byte sequence as UTF-8.
 */
const fs = require('fs');

// Windows-1252 characters in 0x80–0x9F that differ from Latin-1
const w1252Map = new Map([
  ['\u20AC', 0x80], // €
  ['\u201A', 0x82], // ‚
  ['\u0192', 0x83], // ƒ
  ['\u201E', 0x84], // „
  ['\u2026', 0x85], // …
  ['\u2020', 0x86], // †
  ['\u2021', 0x87], // ‡
  ['\u02C6', 0x88], // ˆ
  ['\u2030', 0x89], // ‰
  ['\u0160', 0x8A], // Š
  ['\u2039', 0x8B], // ‹
  ['\u0152', 0x8C], // Œ
  ['\u017D', 0x8E], // Ž
  ['\u2018', 0x91], // '
  ['\u2019', 0x92], // '
  ['\u201C', 0x93], // "
  ['\u201D', 0x94], // "
  ['\u2022', 0x95], // •
  ['\u2013', 0x96], // – (en dash)
  ['\u2014', 0x97], // — (em dash)
  ['\u02DC', 0x98], // ˜
  ['\u2122', 0x99], // ™
  ['\u0161', 0x9A], // š
  ['\u203A', 0x9B], // ›
  ['\u0153', 0x9C], // œ
  ['\u017E', 0x9E], // ž
  ['\u0178', 0x9F], // Ÿ
]);

function hasMojibake(str) {
  // Ã followed by Latin-1 high-byte = two-byte UTF-8 misread as Windows-1252
  // â€ = three-byte UTF-8 starting with 0xE2 0x80 misread as Windows-1252
  return str.includes('\u00C3') || str.includes('\u00E2\u20AC');
}

function fixMojibake(str) {
  const bytes = [];
  for (const char of str) {
    const cp = char.codePointAt(0);
    if (cp <= 0x7F) {
      bytes.push(cp);                      // ASCII — unchanged
    } else if (cp >= 0xA0 && cp <= 0xFF) {
      bytes.push(cp);                      // Latin-1 — byte equals code point
    } else if (w1252Map.has(char)) {
      bytes.push(w1252Map.get(char));      // Windows-1252 special char
    } else {
      // Not a Windows-1252 character; keep as-is (encode to UTF-8 bytes)
      const buf = Buffer.from(char, 'utf8');
      for (const b of buf) bytes.push(b);
    }
  }
  return Buffer.from(bytes).toString('utf8');
}

function processFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP (not found):   ${filePath}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  // Strip UTF-8 BOM if present
  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
  if (!hasMojibake(content)) {
    console.log(`SKIP (already ok):  ${filePath}`);
    return;
  }
  const fixed = fixMojibake(content);
  try {
    JSON.parse(fixed);
  } catch (e) {
    console.error(`ERROR (bad JSON):   ${filePath} — ${e.message}`);
    return;
  }
  fs.writeFileSync(filePath, fixed, 'utf8');
  console.log(`FIXED:              ${filePath}`);
}

const base = 'C:/Users/remco/flash-cards-app';
const files = [
  `${base}/flash-cards/portaal_flashcards_deel1.json`,
  `${base}/flash-cards/portaal_flashcards_deel2.json`,
  `${base}/flash-cards/portaal_flashcards_deel3.json`,
  `${base}/flash-cards/portaal_flashcards_deel4.json`,
  `${base}/flash-cards/portaal_flashcards_deel5.json`,
  `${base}/flashcard-app/public/portaal_flashcards_deel1.json`,
  `${base}/flashcard-app/public/portaal_flashcards_deel2.json`,
  `${base}/flashcard-app/public/portaal_flashcards_deel3.json`,
];

for (const file of files) {
  processFile(file);
}
