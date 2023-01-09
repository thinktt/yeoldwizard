import { html } from './pageTools.js'


const template = html`
  <span class="badge-box" >

    <span v-if="topFeat === 'won'" class="badge"> 
      <span  class="pawn-won" style="color: green" 
        :title="'Legend tells of a time you beat ' + cmpName">
          ♙
      </span>
    </span>

    <span v-if="score > 0" class="badge">
      <span 
        :title="'Your Wiz Score against ' + cmpName + ' is +' + score" class="score">
          +{{score}}
      </span>
    </span> 

    <span v-if="score < 0" class="badge score-down">
      <span 
        :title="'Your Wiz Score against ' + cmpName + ' is +' + score" class="score">
          {{score}}
      </span>
    </span> 

    <span v-if="score === 0" class="badge score-even">
      <span 
        :title="'Your score is even with ' + cmpName" class="score">
          EVEN
      </span>
    </span>

    <span v-if="isNemesis"> 
      <span  class="badguy" :title="cmpName + ' is your Nemesis'">d</span>
    </span> 

    <span v-if="score >= 2" class="badge">
      <span  class="trophy" :title="'You have conqured ' + cmpName">
        t
      </span>
      <span class="trophy-num">+1</span>
    </span>

  </span>
`

export default {
  name: 'WizBadges',
  props: ['cmpName', 'score', 'isNemesis', 'topFeat'],
  template,
  functional: true,
}