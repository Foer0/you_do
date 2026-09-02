// Округление до "красивого" шага (1/2/5 × 10^n) — та же идея, что
// используют чарт-библиотеки для делений оси: не просто max/4, а
// число, которое выглядит естественно на легенде/оси.
export function niceStep(roughStep, fallback = 3600) {
  if (roughStep <= 0) return fallback;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  let niceNormalized;
  if (normalized <= 1) niceNormalized = 1;
  else if (normalized <= 2) niceNormalized = 2;
  else if (normalized <= 5) niceNormalized = 5;
  else niceNormalized = 10;
  return niceNormalized * magnitude;
}
