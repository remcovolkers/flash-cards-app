const fs = require('fs');

const base = 'c:/Users/remco/flash-cards-app';
const src  = base + '/flash-cards';
const pub  = base + '/flashcard-app/public';

function readJson(path) {
  // Strip BOM if present
  let raw = fs.readFileSync(path, 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  return JSON.parse(raw);
}

function writeJson(path, obj) {
  fs.writeFileSync(path, JSON.stringify(obj, null, 2), { encoding: 'utf8' });
}

// ── Deel 1 ────────────────────────────────────────────────────────────────
const d1 = readJson(src + '/portaal_flashcards_deel1.json');
// PowerShell may have renamed meta→metadata or kept meta; handle both
const out1 = {
  metadata: d1.metadata || d1.meta,
  flashcards: d1.flashcards
};
writeJson(src  + '/portaal_flashcards_deel1.json', out1);
writeJson(pub  + '/portaal_flashcards_deel1.json', out1);
console.log('deel1: ' + out1.flashcards.length + ' cards');

// ── Deel 2 ────────────────────────────────────────────────────────────────
const d2 = readJson(src + '/portaal_flashcards_deel2.json');
const out2 = { metadata: d2.metadata, flashcards: d2.flashcards };
writeJson(src  + '/portaal_flashcards_deel2.json', out2);
writeJson(pub  + '/portaal_flashcards_deel2.json', out2);
console.log('deel2: ' + out2.flashcards.length + ' cards');

// ── Deel 3 ────────────────────────────────────────────────────────────────
const d3 = readJson(src + '/portaal_flashcards_deel3.json');
// PowerShell wrapped the array in { value: [...] }; handle all variants
let cards3;
if (Array.isArray(d3)) {
  cards3 = d3;
} else if (d3.flashcards && Array.isArray(d3.flashcards)) {
  cards3 = d3.flashcards;
} else if (d3.flashcards && Array.isArray(d3.flashcards.value)) {
  cards3 = d3.flashcards.value;
} else {
  throw new Error('Cannot parse deel3: ' + JSON.stringify(Object.keys(d3)));
}
const out3 = {
  metadata: {
    titel: 'Portaal Flashcards - Deel 3 van 4',
    totaal_kaarten: cards3.length,
    versie: '1.0'
  },
  flashcards: cards3
};
writeJson(src  + '/portaal_flashcards_deel3.json', out3);
writeJson(pub  + '/portaal_flashcards_deel3.json', out3);
console.log('deel3: ' + out3.flashcards.length + ' cards');

console.log('All done!');
