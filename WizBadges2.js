import { html } from './pageTools.js'


const template = html`
  <span class="badge-box-2" :class="{'has-selection' : selection}">

    <span v-if="topFeat === 'won'" @click="$emit('selectionMade', 'pawn')"
      class="badge" :class="{'selected' : selection === 'pawn'}"> 
        <span  class="pawn-won" :title="'Legend tells of a time you beat ' + cmpName">
          ♙
        </span>
    </span>

    <span v-if="score > 0" @click="$emit('selectionMade', 'score')" 
      class="badge" :class="{'selected' : selection === 'score'}">
        <span class="circle" :title="'Your Wiz Score against ' + cmpName + ' is +' + score">
        </span>
      <span class="score"> +{{score}} </span>
    </span> 

    <span v-if="score < 0" @click="$emit('selectionMade', 'score')"
      class="badge score-down" :class="{'selected' : selection === 'score'}">
        <span class="circle" :title="'Your Wiz Score against ' + cmpName + ' is +' + score"> 
        </span>
        <span class="score">{{score}}</span>
    </span> 

    <span v-if="score === 0" @click="$emit('selectionMade', 'score')"
      class="badge score-even" :class="{'selected' :selection === 'score'}">
        <span 
          :title="'Your score is even with ' + cmpName" class="score">
            EVEN
        </span>
    </span>

    <span v-if="isNemesis" @click="$emit('selectionMade', 'nemesis')"
      class="badge" :class="{'selected' : selection === 'nemesis'}"> 
        <span  class="badguy" :title="cmpName + ' is your Nemesis'">d</span>
    </span> 

    <span v-if="score >= 2" @click="$emit('selectionMade', 'trophy')" 
      class="badge" :class="{'selected' : selection === 'trophy'}">
        <span  class="trophy" :title="'You have conqured ' + cmpName">
          t
        </span>
        <span class="trophy-num">+1</span>
    </span>

  </span>
`

export default {
  name: 'WizBadges2',
  props: ['cmpName', 'score', 'isNemesis', 'topFeat', 'selection'],
  template,
  functional: true,
}