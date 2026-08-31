import { generateQuestions, loadBests, saveBest, unitPrice } from './game.js'
const root = document.querySelector('#root'), yen = new Intl.NumberFormat('ja-JP')
const state = { screen: 'home', difficulty: 'NORMAL', mode: '通常', questions: [], index: 0, answers: [], elapsed: 0, startedAt: 0, questionAt: 0, locked: false, feedback: null, timer: null }
const sec = ms => `${(ms / 1000).toFixed(2)}秒`
const card = (side, item) => {
  let status = ''
  if (state.feedback) status = state.feedback.correct === side ? 'correct' : state.feedback.selected === side ? 'wrong' : ''
  return `<button class="product-card ${side === 'A' ? 'purple' : 'orange'} ${status}" data-answer="${side}" aria-label="${side}、${item.count}個で${item.price}円"><span class="side-label">${side}</span><span class="item-count"><strong>${item.count}</strong><small>個</small></span><span class="divider">で</span><span class="item-price"><strong>${yen.format(item.price)}</strong><small>円</small></span><span class="tap-hint">これが安い</span></button>`
}
function shell(content) { root.innerHTML = `<main class="app screen-${state.screen}"><div class="ambient one"></div><div class="ambient two"></div>${content}</main>` }
function renderHome() {
  clearInterval(state.timer); const best = loadBests()[state.difficulty]
  shell(`<section class="home panel"><div class="brand-mark" aria-hidden="true"><span>¥</span><span>÷</span></div><p class="eyebrow">UNIT PRICE SPRINT</p><h1>どっちが<br><em>安い？</em></h1><p class="intro">10問連続で、1個あたり安い商品を選んでください</p>
  <div class="setting"><span class="setting-title">難易度</span><div class="segmented">${['EASY','NORMAL','HARD'].map(d => `<button data-difficulty="${d}" class="${state.difficulty === d ? 'active' : ''}">${d}</button>`).join('')}</div></div>
  <div class="setting"><span class="setting-title">プレイモード <small>（記録用ラベル）</small></span><div class="segmented modes">${['通常','暗算法'].map(m => `<button data-mode="${m}" class="${state.mode === m ? 'active' : ''}">${m}</button>`).join('')}</div></div>
  <button class="primary" data-action="start">スタート <span>→</span></button>${best ? `<div class="mini-best"><span>${state.difficulty} 自己ベスト</span><strong>${best.bestScore.toFixed(2)}秒</strong><small>正答率 ${best.bestAccuracy}% ・ 最速 ${best.fastestTime.toFixed(2)}秒</small></div>` : ''}<p class="keyboard-hint">PCでは A / B キーでも回答できます</p></section>`)
}
function renderGame() {
  const q = state.questions[state.index]
  shell(`<section class="game"><header class="game-header"><button class="quit" data-action="quit" aria-label="やめる">×</button><div class="progress-wrap"><div class="progress-meta"><strong>${state.index + 1} <span>/ 10</span></strong><time id="timer">${sec(state.elapsed)}</time></div><div class="progress"><i style="width:${state.index * 10}%"></i></div></div></header><div class="game-title"><p>1個あたり</p><h2>安いのはどっち？</h2></div><div class="cards">${card('A', q.a)}<div class="versus">VS</div>${card('B', q.b)}</div><p class="mode-label">${state.difficulty} ・ ${state.mode}</p></section>`)
}
function start() {
  Object.assign(state, { screen:'game', questions:generateQuestions(state.difficulty), index:0, answers:[], elapsed:0, feedback:null, locked:false, startedAt:performance.now(), questionAt:performance.now() })
  renderGame(); clearInterval(state.timer); state.timer = setInterval(() => { state.elapsed = performance.now() - state.startedAt; const el = document.querySelector('#timer'); if(el) el.textContent = sec(state.elapsed) }, 31)
}
function choose(selected) {
  if (state.locked || state.screen !== 'game') return
  state.locked = true; const now = performance.now(), q = state.questions[state.index]
  state.answers.push({ ...q, selected, correctAnswer:selected === q.correct, responseMs:now - state.questionAt }); state.feedback = { selected, correct:q.correct }; renderGame()
  setTimeout(() => { if (state.index === 9) { state.elapsed = now - state.startedAt; saveBest(state.difficulty, state.elapsed / 1000, state.answers.filter(a => a.correctAnswer).length); state.screen = 'result'; renderResult() } else { state.index++; state.feedback=null; state.questionAt=performance.now(); state.locked=false; renderGame() } }, 300)
}
function renderResult() {
  clearInterval(state.timer); const correct = state.answers.filter(a => a.correctAnswer).length, total = state.elapsed / 1000, record = total + (10-correct)*5
  const title = correct === 10 && total < 20 ? '電光石火の買い物王' : correct === 10 ? 'パーフェクト鑑定士' : correct >= 8 ? '単価マスター' : correct >= 6 ? '目利きルーキー' : '伸びしろ発見！'
  shell(`<section class="result panel"><p class="eyebrow">RESULT</p><div class="trophy">✦</div><h1>${title}</h1><p class="result-mode">${state.difficulty} ・ ${state.mode}</p><div class="record"><span>総合タイム</span><strong>${record.toFixed(2)}<small>秒</small></strong><p>実測 ${total.toFixed(2)}秒 ＋ ミス ${10-correct} × 5秒</p></div><div class="stats"><div><span>正答数</span><strong>${correct}<small> / 10</small></strong></div><div><span>正答率</span><strong>${correct*10}<small>%</small></strong></div><div><span>平均</span><strong>${(total/10).toFixed(2)}<small>秒</small></strong></div></div><div class="actions"><button class="primary" data-action="start">もう一度挑戦 <span>↻</span></button><button class="secondary" data-action="copy">結果をJSONでコピー</button><button class="text-button" data-action="quit">設定に戻る</button></div><div class="answer-list"><h2>10問の記録</h2>${state.answers.map((a,i) => `<article class="${a.correctAnswer?'ok':'ng'}"><div class="answer-head"><strong>Q${i+1} <span>${a.correctAnswer?'✓ 正解':'× 不正解'}</span></strong><time>${sec(a.responseMs)}</time></div><div class="answer-products"><div class="${a.correct==='A'?'winner':''}"><b>A</b><span>${a.a.count}個 ${yen.format(a.a.price)}円</span><small>1個 ${unitPrice(a.a).toFixed(2)}円</small></div><div class="${a.correct==='B'?'winner':''}"><b>B</b><span>${a.b.count}個 ${yen.format(a.b.price)}円</span><small>1個 ${unitPrice(a.b).toFixed(2)}円</small></div></div><p>あなたの回答: <b>${a.selected}</b>　正解: <b>${a.correct}</b></p></article>`).join('')}</div></section>`)
}
async function copyResults(button) {
  const correct = state.answers.filter(a=>a.correctAnswer).length, total = state.elapsed/1000
  const data = { exportedAt:new Date().toISOString(), difficulty:state.difficulty, playMode:state.mode, correctCount:correct, accuracy:correct*10, totalSeconds:+total.toFixed(3), score:+(total+(10-correct)*5).toFixed(3), questions:state.answers.map((a,i)=>({number:i+1,A:a.a,B:a.b,selected:a.selected,correct:a.correct,isCorrect:a.correctAnswer,responseSeconds:+(a.responseMs/1000).toFixed(3),unitPriceA:+unitPrice(a.a).toFixed(4),unitPriceB:+unitPrice(a.b).toFixed(4)})) }
  const text = JSON.stringify(data,null,2)
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
    await navigator.clipboard.writeText(text)
  } catch {
    const area = document.createElement('textarea'); area.value=text; area.style.position='fixed'; area.style.opacity='0'; document.body.append(area); area.select();
    const ok = document.execCommand('copy'); area.remove(); if (!ok) throw new Error('Copy failed')
  }
  button.textContent='コピーしました！'; setTimeout(()=>button.textContent='結果をJSONでコピー',1800)
}
root.addEventListener('click', e => { const b=e.target.closest('button'); if(!b)return; if(b.dataset.difficulty){state.difficulty=b.dataset.difficulty;renderHome()} else if(b.dataset.mode){state.mode=b.dataset.mode;renderHome()} else if(b.dataset.answer)choose(b.dataset.answer); else if(b.dataset.action==='start')start(); else if(b.dataset.action==='quit'){state.screen='home';renderHome()} else if(b.dataset.action==='copy')copyResults(b) })
window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='a'||e.key==='ArrowLeft')choose('A');if(e.key.toLowerCase()==='b'||e.key==='ArrowRight')choose('B')})
renderHome()
