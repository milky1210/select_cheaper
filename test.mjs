import { compareItems, findCheapest, generateQuestions, unitGapRatio } from './src/game.js'
import assert from 'node:assert/strict'

assert.equal(compareItems({count:13,price:1078},{count:19,price:1547}),1)
for (const difficulty of ['EASY','MIDDLE','HARD','EXTRA']) {
  for (const choiceCount of [2,3,4,5]) {
    for (let run=0;run<25;run++) {
      const qs=generateQuestions(difficulty,choiceCount)
      assert.equal(qs.length,10)
      for (const q of qs) {
        assert.equal(q.options.length,choiceCount)
        assert.equal(q.correct,findCheapest(q.options))
        const sorted=[...q.options].sort(compareItems)
        const gap=unitGapRatio(sorted[0],sorted[1])
        if(difficulty==='HARD')assert.ok(gap>=.008&&gap<=.03)
        else if(difficulty==='EXTRA')assert.ok(gap>=.002&&gap<=.01)
        else assert.ok(gap>=.07&&gap<=.35)
        for(const item of q.options){assert.ok(item.price>=300&&item.price<=3000);if(difficulty==='EASY'){assert.ok([5,10,15,20,25,30].includes(item.count));assert.equal(item.price%10,0)}else{assert.ok(item.count%5!==0);assert.ok(item.price%10!==0)}}
      }
    }
  }
}
console.log('All game logic tests passed')
