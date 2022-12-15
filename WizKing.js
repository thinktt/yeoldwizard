import { html } from './pageTools.js'

const ladderKing = html`
  <span v-if="scoreMode == 'ladder'">
    <span v-if="topFeat === 'won'">
    
      <img :title="'Youve beaten ' + cmpName"
        class="king" 
        src="images/king-won.png" 
        alt="won">
  
      <img v-if="topFeat === 'lost'"
        :title="cmpName + ' has always beaten you'"
        class="king" 
        src="images/king-lost.png" 
        alt="lost">

      <img v-if="topFeat === 'draw'"
        :title="'Your best is a draw with ' + cmpName"
        class="king" 
        src="images/king-draw.png" 
        alt="draw">

    </span>
  </span>
`

const scoreKing = html`
  <span v-if="scoreMode == 'score'">
    <span v-if="score >= 1" class="king-box" >
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
      <!-- <img class="shield" src="images/shield.png"> -->
      <!-- <img class="coolguy" src="images/cool2.svg"> -->
      <!-- <img class="flag" src="images/redflag.png">  -->
      <!-- <span class="badge-icon">♙</span> -->
      <span v-if="score >= 2" class="trophy" :title="'You have conqured ' + cmpName">
        t
      </span>
    </span>


    <span v-if="score < 0" class="king-box score-down">
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
      <span v-if="score <= -3" class="badguy" :title="cmpName + ' is you Nemesis'">d</span>

    </span>

    <span v-if="score === 0" class="king-box score-even">
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
  <div>
    ${ scoreKing }
    ${ ladderKing }
  </div> 
`

export default {
  name: 'WizKing',
  props: ['cmpName', 'score', 'scoreMode', 'topFeat'],
  template,
  functional: true,
}