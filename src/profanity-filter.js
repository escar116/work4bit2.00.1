import filipinoBadWords from './filipino-badwords-list.js';
import enBadWordsRaw from './en.txt?raw';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Parse en.txt lines into array
const enBadWords = enBadWordsRaw
  .split(/\r?\n/)
  .map(line => line.trim().toLowerCase())
  .filter(Boolean);

// Combine and deduplicate
const allBadWordsSet = new Set([
  ...filipinoBadWords.map(w => w.trim().toLowerCase()).filter(Boolean),
  ...enBadWords
]);

export const allBadWords = Array.from(allBadWordsSet).sort((a, b) => b.length - a.length);

// Build regex with boundary lookarounds and flexible repetition support for 4+ letter words
const patternStrings = allBadWords.map(term => {
  let core;
  if (term.length <= 3 || !/^[a-zA-Z0-9_\s]+$/.test(term)) {
    // Exact match for short words or special symbols (e.g. 's&m', '🖕', 'xx')
    const parts = term.split(/\s+/).map(escapeRegExp);
    core = parts.join('\\s+');
  } else if (term.includes(' ')) {
    // Multi-word phrase: expand words with 3+ letters to allow repeated characters (e.g. 'putaaang inaa')
    const parts = term.split(/\s+/).map(word => {
      if (word.length >= 3 && /^[a-zA-Z]+$/.test(word)) {
        return word.split('').map(c => `${escapeRegExp(c)}+`).join('');
      }
      return escapeRegExp(word);
    });
    core = parts.join('\\s+');
  } else if (/^[a-zA-Z]+$/.test(term) && term.length >= 4) {
    // Single word with 4+ letters: expand characters to match elongated spellings like 'fuuuuck', 'gagooo'
    core = term.split('').map(c => `${escapeRegExp(c)}+`).join('');
  } else {
    core = escapeRegExp(term);
  }

  const startBound = /^\w/.test(term) ? '(?<![a-zA-Z0-9_])' : '';
  const endBound = /\w$/.test(term) ? '(?![a-zA-Z0-9_])' : '';
  return `${startBound}${core}${endBound}`;
});

export const profanityRegex = new RegExp(patternStrings.join('|'), 'gi');

/**
 * Replaces curse words and profanities with asterisks.
 * Preserves spaces within multi-word phrases (e.g. "putang ina" -> "****** ****").
 * @param {string} text - The input text to censor.
 * @returns {string} - The censored text with asterisks.
 */
export function censorProfanity(text) {
  if (!text || typeof text !== 'string') return text || '';
  return text.replace(profanityRegex, (match) => {
    return match.replace(/[^\s]/g, '*');
  });
}

/**
 * Checks if the text contains any censored curse words.
 * @param {string} text - The input text to check.
 * @returns {boolean} - True if profanity is detected.
 */
export function containsProfanity(text) {
  if (!text || typeof text !== 'string') return false;
  profanityRegex.lastIndex = 0;
  return profanityRegex.test(text);
}

/**
 * Returns an array of matched profanities found in the text.
 * @param {string} text - The input text to analyze.
 * @returns {string[]} - Array of matching profanities.
 */
export function getProfanities(text) {
  if (!text || typeof text !== 'string') return [];
  const matches = text.match(profanityRegex);
  return matches ? Array.from(new Set(matches.map(m => m.toLowerCase()))) : [];
}

export { filipinoBadWords, enBadWords };
