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

/**
 * Censors profanities during live typing, avoiding prematurely mangling words
 * that the user is actively still typing at the current cursor position.
 * @param {string} text - The input text to censor.
 * @param {number} [cursorIndex] - The active cursor position (selectionEnd).
 * @returns {string} - The censored text.
 */
export function censorProfanityLive(text, cursorIndex) {
  if (!text || typeof text !== 'string') return text || '';
  return text.replace(profanityRegex, (match, offset) => {
    const matchEnd = offset + match.length;
    const isActivelyTypingThisWord = (typeof cursorIndex === 'number' && cursorIndex === matchEnd && matchEnd === text.length);
    if (isActivelyTypingThisWord) {
      return match;
    }
    return match.replace(/[^\s]/g, '*');
  });
}

/**
 * Attaches real-time profanity filtering to an input or textarea element.
 * Turns curse words to asterisks as words are completed during typing, and
 * completely on change / blur / submit, preserving cursor selection position.
 * @param {HTMLInputElement|HTMLTextAreaElement} el
 */
export function attachLiveProfanityFilter(el) {
  if (!el || el._hasProfanityFilter) return;
  el._hasProfanityFilter = true;

  const onInput = () => {
    const val = el.value;
    if (!val || typeof val !== 'string') return;
    const cursor = el.selectionEnd;
    const censored = censorProfanityLive(val, cursor);
    if (val !== censored) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      el.value = censored;
      if (typeof start === 'number' && typeof end === 'number') {
        try {
          el.setSelectionRange(start, end);
        } catch (e) { }
      }
    }
  };

  const onBlurOrChange = () => {
    const val = el.value;
    if (!val || typeof val !== 'string') return;
    const censored = censorProfanity(val);
    if (val !== censored) {
      el.value = censored;
    }
  };

  el.addEventListener('input', onInput);
  el.addEventListener('change', onBlurOrChange);
  el.addEventListener('blur', onBlurOrChange);
}

/**
 * Initializes live profanity filtering across all designated input fields.
 */
export function initAllCensoredInputs() {
  const targetSelectors = [
    '#edit-bio',               // Edit Profile: About Me
    '#port-title',             // Add Portfolio: Project Title
    '#port-desc',              // Add Portfolio: Project Description
    '#review-comment',         // Complete Job: Review & Feedback
    '#nr-title',               // Post / Edit Listing: Service Title
    '#nr-description',         // Post / Edit Listing: Service Description
    '#apply-message',          // Avail / Apply: Order Details & Scope / Cover Message
    '#mentoring-title',        // Mentoring Proposal: Title
    '#mentoring-desc',         // Mentoring Proposal: Description
    '#chat-input'              // Live Chat Message Input
  ];

  targetSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => {
      attachLiveProfanityFilter(el);
    });
  });
}

export { filipinoBadWords, enBadWords };
