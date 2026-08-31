import { compareItems, generateQuestions } from './src/game.js'
import assert from 'node:assert/strict'
assert.equal(compareItems({count:13,price:1078},{count:19,price:1547}),'B')
for(const difficulty of ['EASY','NORMAL','HARD']) for(let run=0;run<25;run++){const qs=generateQuestions(difficulty);assert.equal(qs.length,10);assert.equal(qs.filter(q=>q.correct==='A').length,5);for(const q of qs){assert.equal(q.correct,compareItems(q.a,q.b));assert.ok(q.a.price>=300&&q.a.price<=3000&&q.b.price>=300&&q.b.price<=3000)}}
console.log('All game logic tests passed')
