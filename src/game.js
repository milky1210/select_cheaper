export const BEST_KEY = 'docchi-ga-yasui:bests:v1'
const ranges = {
  EASY: { counts: [5, 15], units: [45, 120], diff: [12, 30], jitter: 2 },
  NORMAL: { counts: [8, 25], units: [45, 125], diff: [5, 13], jitter: 7 },
  HARD: { counts: [12, 30], units: [45, 115], diff: [2.6, 7], jitter: 11 },
}
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
function makeItem(count, unit, jitter) {
  let price = Math.round(count * unit + randomInt(-jitter, jitter))
  price = Math.max(300, Math.min(3000, price))
  if (price % count === 0) price += price < 3000 ? 1 : -1
  return { count, price }
}
export function compareItems(a, b) { return a.price * b.count < b.price * a.count ? 'A' : 'B' }
export function generateQuestions(difficulty) {
  const cfg = ranges[difficulty]
  const desired = [...Array(5).fill('A'), ...Array(5).fill('B')].sort(() => Math.random() - .5)
  return desired.map((side, i) => {
    let a, b
    for (let tries = 0; tries < 200; tries++) {
      const lowerUnit = randomInt(cfg.units[0], cfg.units[1])
      const delta = cfg.diff[0] + Math.random() * (cfg.diff[1] - cfg.diff[0])
      const cheap = makeItem(randomInt(...cfg.counts), lowerUnit, cfg.jitter)
      const costly = makeItem(randomInt(...cfg.counts), lowerUnit + delta, cfg.jitter)
      ;[a, b] = [cheap, costly]
      if (a.count !== b.count && a.price !== b.price && Math.abs(a.price * b.count - b.price * a.count) > Math.min(a.count, b.count)) break
    }
    if (compareItems(a, b) !== side) [a, b] = [b, a]
    return { id: `${Date.now()}-${i}-${a.count}-${a.price}-${b.count}-${b.price}`, a, b, correct: compareItems(a, b) }
  })
}
export const unitPrice = item => item.price / item.count
export function loadBests() { try { return JSON.parse(localStorage.getItem(BEST_KEY) || '{}') } catch { return {} } }
export function saveBest(difficulty, totalSeconds, correctCount) {
  const all = loadBests(), accuracy = correctCount * 10, score = totalSeconds + (10 - correctCount) * 5, prev = all[difficulty]
  all[difficulty] = { bestScore: Math.min(prev?.bestScore ?? Infinity, score), bestAccuracy: Math.max(prev?.bestAccuracy ?? 0, accuracy), fastestTime: Math.min(prev?.fastestTime ?? Infinity, totalSeconds) }
  localStorage.setItem(BEST_KEY, JSON.stringify(all)); return all[difficulty]
}
