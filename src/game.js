export const BEST_KEY = 'docchi-ga-yasui:clear-bests:v2'

const friendlyCounts = [5, 10, 15, 20, 25, 30]
const awkwardCounts = [7, 8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 21, 22, 23, 24, 26, 27, 28, 29]
const settings = {
  EASY: { counts: friendlyCounts, units: [60, 73], gap: [.07, .35], roundTo: 10 },
  MIDDLE: { counts: awkwardCounts, units: [60, 73], gap: [.07, .35], roundTo: 1 },
  HARD: { counts: awkwardCounts, units: [60, 100], gap: [.008, .03], roundTo: 1 },
  EXTRA: { counts: awkwardCounts, units: [60, 100], gap: [.002, .01], roundTo: 1 },
}

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randomFloat = (min, max) => min + Math.random() * (max - min)
const shuffled = values => [...values].sort(() => Math.random() - .5)

function makeItem(count, targetUnit, config) {
  let price = Math.round((count * targetUnit) / config.roundTo) * config.roundTo
  price = Math.max(300, Math.min(3000, price))
  if (config.roundTo === 1) {
    for (let n = 0; n < 10 && (price % count === 0 || price % 10 === 0); n++) price += price < 2998 ? 1 : -1
  }
  return { count, price }
}

export function compareItems(a, b) {
  const cross = a.price * b.count - b.price * a.count
  return cross < 0 ? -1 : cross > 0 ? 1 : 0
}

export function findCheapest(options) {
  return options.reduce((best, item, index) => compareItems(item, options[best]) < 0 ? index : best, 0)
}

export function unitGapRatio(a, b) {
  const unitA = a.price / a.count, unitB = b.price / b.count
  return Math.abs(unitA - unitB) / Math.min(unitA, unitB)
}

function secondPlaceGap(options, winner) {
  const ordered = options.map((item, index) => ({ item, index })).sort((x, y) => compareItems(x.item, y.item))
  if (ordered[0].index !== winner || compareItems(ordered[0].item, ordered[1].item) === 0) return null
  return unitGapRatio(ordered[0].item, ordered[1].item)
}

function generateQuestion(difficulty, choiceCount, desiredWinner, questionNumber) {
  const config = settings[difficulty]
  for (let tries = 0; tries < 1500; tries++) {
    const baseUnit = randomFloat(config.units[0], config.units[1])
    const counts = shuffled(config.counts).slice(0, choiceCount)
    const options = counts.map((count, index) => {
      const gap = index === desiredWinner ? 0 : randomFloat(config.gap[0], config.gap[1])
      return makeItem(count, baseUnit * (1 + gap), config)
    })
    const actualWinner = findCheapest(options)
    const actualGap = secondPlaceGap(options, actualWinner)
    if (actualWinner === desiredWinner && actualGap !== null && actualGap >= config.gap[0] && actualGap <= config.gap[1]) {
      return { id: `${Date.now()}-${questionNumber}-${options.map(x => `${x.count}-${x.price}`).join('-')}`, options, correct: actualWinner, baseUnit }
    }
  }
  throw new Error(`Failed to generate ${difficulty} question`)
}

export function generateQuestions(difficulty, choiceCount = 2) {
  if (!settings[difficulty]) throw new Error('Unknown difficulty')
  if (choiceCount < 2 || choiceCount > 5) throw new Error('choiceCount must be 2-5')
  const winners = shuffled(Array.from({ length: 10 }, (_, i) => i % choiceCount))
  return winners.map((winner, i) => generateQuestion(difficulty, choiceCount, winner, i))
}

export const unitPrice = item => item.price / item.count
export function loadBests() { try { return JSON.parse(localStorage.getItem(BEST_KEY) || '{}') } catch { return {} } }
export function bestKey(difficulty, choiceCount) { return `${difficulty}:${choiceCount}` }
export function saveClearBest(difficulty, choiceCount, totalSeconds) {
  const all = loadBests(), key = bestKey(difficulty, choiceCount)
  all[key] = Math.min(all[key] ?? Infinity, totalSeconds)
  localStorage.setItem(BEST_KEY, JSON.stringify(all))
  return all[key]
}
