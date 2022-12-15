import { html } from './pageTools.js'

const ladderKing = html`
  <span v-if="scoreMode == 'ladder'">
    <span class="badge-box-2">
      
      <span v-if="topFeat === 'won'" class="badge-container"> 
        <span  class="pawn-won" style="color: green" 
          :title="'Legend tells of a time you beat ' + cmpName">♙</span>
        <span  class="pawn-head" style="color: green">b</span>
        <span class="circle"></span>
      </span>

      <span v-if="topFeat === 'draw'" class="badge-container"> 
        <span  class="pawn-won" style="color: gray" 
        :title="'The best you have ever done is draw against ' + cmpName">♙</span>
        <span  class="pawn-head" style="color: gray">f</span>
        <span class="circle"></span>
      </span>

      <span v-if="topFeat === 'lost'" class="badge-container"> 
        <span  class="pawn-won" style="color: crimson" 
          :title="'You’ve tried but never beaten ' + cmpName">♙</span>
        <span  class="pawn-head" style="color: crimson">e</span>
        <span class="circle"></span>
      </span>

    </span>
</span>
`

const scoreKing = html`
  <span v-if="scoreMode == 'score'">
    <span v-if="score >= 1" class="badge-box" >
      <img 
      class="king" 
      src="images/king-won.png" 
      alt="postive win score"
      title="You have a positive score against this opponent"
      >
      <span 
        :title="'Your Wiz Score against ' + cmpName + ' is +' + score" class="score">
          +{{score}}
      </span>
      <span v-if="score >= 2" class="trophy" :title="'You have conqured ' + cmpName">
        t
      </span>
    </span>


    <span v-if="score < 0" class="badge-box score-down">
      <img 
      class="king" 
      src="images/king-lost.png" 
      alt="negative score"
      title="You have a negative score against this opponent"
      >
      <span 
        :title="'Your Wiz Score against ' + cmpName + ' is ' + score" class="score">
          {{score}}
      </span>
      <span v-if="isNemesis" class="badguy" :title="cmpName + ' is your Nemesis'">d</span>

    </span>

    <span v-if="score === 0" class="badge-box score-even">
      <img
      class="king" 
      src="images/king-draw.png" 
      alt="even score"
      title="You have an even score against this opponent"
      >
      <span 
        :title="'Your score is even with ' + cmpName" class="score">
          EVEN
      </span>
    </span> 
  </span>
`

const template = html`
  <span>
    ${ scoreKing }
    ${ ladderKing }
  </span> 
`

export default {
  name: 'WizKing',
  props: ['cmpName', 'score', 'isNemesis', 'scoreMode', 'topFeat'],
  template,
  functional: true,
}