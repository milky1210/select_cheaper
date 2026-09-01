import { bestKey, generateQuestions, loadBests, saveClearBest, unitPrice } from './game.js'

const root = document.querySelector('#root'), yen = new Intl.NumberFormat('ja-JP'), labels = ['A', 'B', 'C', 'D', 'E']
const difficultyLabels = { EASY: 'EASY', MIDDLE: 'MIDDLE', HARD: 'HARD', EXTRA: 'EXTRA HARD' }
const state = { screen: 'home', difficulty: 'MIDDLE', choiceCount: 2, questions: [], index: 0, answers: [], elapsed: 0, startedAt: 0, questionAt: 0, locked: false, feedback: null, timer: null, cleared: false }
const sec = ms => `${(ms / 1000).toFixed(2)}秒`

function card(index, item, many) {
  let status = ''
  if (state.feedback) status = state.feedback.correct === index ? 'correct' : state.feedback.selected === index ? 'wrong' : ''
  return `<button class="product-card choice-${index} ${many ? 'compact' : ''} ${status}" data-answer="${index}" aria-label="${labels[index]}、${item.count}個で${item.price}円"><span class="side-label">${labels[index]}</span><span class="item-count"><strong>${item.count}</strong><small>個</small></span><span class="divider">で</span><span class="item-price"><strong>${yen.format(item.price)}</strong><small>円</small></span><span class="tap-hint">これが最安</span></button>`
}
function shell(content) { root.innerHTML = `<main class="app screen-${state.screen}"><div class="ambient one"></div><div class="ambient two"></div>${content}</main>` }

function renderHome() {
  clearInterval(state.timer)
  const best = loadBests()[bestKey(state.difficulty, state.choiceCount)]
  shell(`<section class="home panel"><div class="brand-mark" aria-hidden="true"><span>¥</span><span>÷</span></div><p class="eyebrow">UNIT PRICE SURVIVAL</p><h1>どっちが<br><em>安い？</em></h1><p class="intro">10問全問正解を目指せ。1問でも間違えたらゲームオーバー。</p>
  <div class="setting"><span class="setting-title">難易度</span><div class="segmented difficulties">${Object.keys(difficultyLabels).map(d => `<button data-difficulty="${d}" class="${state.difficulty === d ? 'active' : ''}">${difficultyLabels[d]}</button>`).join('')}</div></div>
  <div class="setting"><span class="setting-title">選択肢の数</span><div class="segmented choice-setting">${[2,3,4,5].map(n => `<button data-choices="${n}" class="${state.choiceCount === n ? 'active' : ''}">${n}択</button>`).join('')}</div></div>
  <button class="primary" data-action="start">スタート <span>→</span></button>${best ? `<div class="mini-best"><span>${difficultyLabels[state.difficulty]}・${state.choiceCount}択 ベスト</span><strong>${best.toFixed(2)}秒</strong><small>10問全問正解の最速タイム</small></div>` : ''}<p class="keyboard-hint">PCでは A〜E キーでも回答できます</p></section>`)
}

function renderGame() {
  const q = state.questions[state.index], many = state.choiceCount > 2
  shell(`<section class="game"><header class="game-header"><button class="quit" data-action="quit" aria-label="やめる">×</button><div class="progress-wrap"><div class="progress-meta"><strong>${state.index + 1} <span>/ 10</span></strong><time id="timer">${sec(state.elapsed)}</time></div><div class="progress"><i style="width:${state.index * 10}%"></i></div></div></header><div class="game-title"><p>1個あたり</p><h2>いちばん安いのは？</h2></div><div class="cards choices-${state.choiceCount} ${many ? 'many' : ''}">${q.options.map((item, i) => card(i, item, many)).join('')}</div><p class="mode-label">${difficultyLabels[state.difficulty]} ・ ${state.choiceCount}択</p></section>`)
}

function start() {
  Object.assign(state, { screen:'game', questions:generateQuestions(state.difficulty, state.choiceCount), index:0, answers:[], elapsed:0, feedback:null, locked:false, cleared:false, startedAt:performance.now(), questionAt:performance.now() })
  renderGame(); clearInterval(state.timer); state.timer = setInterval(() => { state.elapsed = performance.now() - state.startedAt; const el = document.querySelector('#timer'); if(el) el.textContent = sec(state.elapsed) }, 31)
}

function choose(selected) {
  if (state.locked || state.screen !== 'game' || selected >= state.choiceCount) return
  state.locked = true
  const now = performance.now(), q = state.questions[state.index], isCorrect = selected === q.correct
  state.answers.push({ ...q, selected, correctAnswer:isCorrect, responseMs:now - state.questionAt })
  state.feedback = { selected, correct:q.correct }; renderGame()
  setTimeout(() => {
    if (!isCorrect || state.index === 9) {
      state.elapsed = now - state.startedAt; state.cleared = isCorrect && state.index === 9
      if (state.cleared) saveClearBest(state.difficulty, state.choiceCount, state.elapsed / 1000)
      state.screen = 'result'; renderResult()
    } else {
      state.index++; state.feedback=null; state.questionAt=performance.now(); state.locked=false; renderGame()
    }
  }, 300)
}

function renderResult() {
  clearInterval(state.timer)
  const total = state.elapsed / 1000, correct = state.answers.filter(a => a.correctAnswer).length
  shell(`<section class="result panel"><p class="eyebrow">${state.cleared ? 'PERFECT CLEAR' : 'GAME OVER'}</p><div class="trophy">${state.cleared ? '✦' : '×'}</div><h1>${state.cleared ? '全問正解！' : `${state.answers.length}問目で終了`}</h1><p class="result-mode">${difficultyLabels[state.difficulty]} ・ ${state.choiceCount}択</p><div class="record"><span>${state.cleared ? 'クリアタイム' : '終了タイム'}</span><strong>${total.toFixed(2)}<small>秒</small></strong><p>${state.cleared ? '10 / 10 PERFECT' : `${correct}問連続正解`}</p></div><div class="stats"><div><span>回答数</span><strong>${state.answers.length}<small> / 10</small></strong></div><div><span>連続正解</span><strong>${correct}<small>問</small></strong></div><div><span>平均</span><strong>${(total/state.answers.length).toFixed(2)}<small>秒</small></strong></div></div><div class="actions"><button class="primary" data-action="start">もう一度挑戦 <span>↻</span></button><button class="secondary" data-action="copy">結果をJSONでコピー</button><button class="text-button" data-action="quit">設定に戻る</button></div><div class="answer-list"><h2>回答の記録</h2>${state.answers.map((a,i) => `<article class="${a.correctAnswer?'ok':'ng'}"><div class="answer-head"><strong>Q${i+1} <span>${a.correctAnswer?'✓ 正解':'× 不正解'}</span></strong><time>${sec(a.responseMs)}</time></div><div class="answer-products multi-result">${a.options.map((item,j)=>`<div class="${a.correct===j?'winner':''}"><b>${labels[j]}</b><span>${item.count}個 ${yen.format(item.price)}円</span><small>1個 ${unitPrice(item).toFixed(2)}円</small></div>`).join('')}</div><p>あなたの回答: <b>${labels[a.selected]}</b>　正解: <b>${labels[a.correct]}</b></p></article>`).join('')}</div></section>`)
}

async function copyResults(button) {
  const data = { exportedAt:new Date().toISOString(), difficulty:state.difficulty, choiceCount:state.choiceCount, cleared:state.cleared, answeredCount:state.answers.length, totalSeconds:+(state.elapsed/1000).toFixed(3), questions:state.answers.map((a,i)=>({number:i+1,options:a.options.map((x,j)=>({label:labels[j],...x,unitPrice:+unitPrice(x).toFixed(4)})),selected:labels[a.selected],correct:labels[a.correct],isCorrect:a.correctAnswer,responseSeconds:+(a.responseMs/1000).toFixed(3)})) }
  const text=JSON.stringify(data,null,2)
  try { if(!navigator.clipboard?.writeText)throw new Error();await navigator.clipboard.writeText(text) } catch { const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.append(area);area.select();document.execCommand('copy');area.remove() }
  button.textContent='コピーしました！';setTimeout(()=>button.textContent='結果をJSONでコピー',1800)
}

root.addEventListener('click', e => { const b=e.target.closest('button');if(!b)return;if(b.dataset.difficulty){state.difficulty=b.dataset.difficulty;renderHome()}else if(b.dataset.choices){state.choiceCount=Number(b.dataset.choices);renderHome()}else if(b.dataset.answer!==undefined)choose(Number(b.dataset.answer));else if(b.dataset.action==='start')start();else if(b.dataset.action==='quit'){state.screen='home';renderHome()}else if(b.dataset.action==='copy')copyResults(b) })
window.addEventListener('keydown',e=>{const i=labels.indexOf(e.key.toUpperCase());if(i>=0)choose(i)})
renderHome()
