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
    <span v-if="score >= 1" >
      <span class="score">{{'+' + score}}</span>
      <img 
        :title="'Your Wiz Score against ' + cmpName + ' is +' + score"
        class="king" 
        src="images/king-won.png" 
        alt="postive win score"
      >
    </span>

    <span v-if="score < 0">
      <span class="score">{{score}}</span>
      <img 
      :title="'Your Wiz Score against ' + cmpName + ' is ' + score"
        class="king" 
        src="images/king-lost.png" 
        alt="negative score"
      >
    </span>

    <span v-if="score === 0 ">
      <span class="score-even">EVEN</span>
      <img
      :title="'Your Wiz Score against ' + cmpName + ' is ' + score"
        class="king" 
        src="images/king-draw.png" 
        alt="even score"
      >
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
  props: ['cmpName', 'score', 'scoreMode', 'topFeat'],
  template,
  functional: true,
}