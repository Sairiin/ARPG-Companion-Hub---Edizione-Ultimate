// js/utils.js

export const HUB_GAMES = {
  poe1: 'Path of Exile 1',
  poe2: 'Path of Exile 2',
  le: 'Last Epoch',
  d2: 'Diablo II: Resurrected',
  d4: 'Diablo 4'
};

export function buildElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}