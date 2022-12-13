import {html, css} from './pageTools.js'


const ladderKing = html`
  <span v-if="scoreMode == 'ladder'">
    <span v-if="topFeat === 'won'">
    
      <img :title="'Youve beaten ' + cmp.name"
        class="king" 
        src="images/king-won.png" 
        alt="won">
  
      <img v-if="topFeat === 'lost'"
        :title="cmp.name + ' has always beaten you'"
        class="king" 
        src="images/king-lost.png" 
        alt="lost">

      <img v-if="topFeat === 'draw'"
        :title="'Your best is a draw with ' + cmp.name"
        class="king" 
        src="images/king-draw.png" 
        alt="draw">

    </span>
  </span>
`

const scoreKing = html`
  <span v-if="scoreMode == 'score'">
    <span v-if="score >= 1" >
      <span class="score">{{score}}</span>
      <img 
        :title="'Your Wiz Score against ' + cmp.name + ' is ' + score"
        class="king" 
        src="images/king-won.png" 
        alt="postive win score"
      >
    </span>

    <span v-if="score < 0">
      <span class="score">{{score}}</span>
      <img 
      :title="'Your Wiz Score against ' + cmp.name + ' is ' + score"
        class="king" 
        src="images/king-lost.png" 
        alt="negative score"
      >
    </span>

    <span v-if="score === 0 ">
      <span class="score-even">EVEN</span>
      <img
      :title="'Your Wiz Score against ' + cmp.name + ' is ' + score"
        class="king" 
        src="images/king-draw.png" 
        alt="even score"
      >
    </span> 
  </span>
`

const template =  html`
  <div> 
    ${ scoreKing }
    ${ ladderKing }

    <div class="cmp">
      <a :name="cmp.name"></a>
      <img class="face" :src="'images/faces/' + cmp.face" alt="cmp.name"

        :class="{
          selected: selectedName === cmp.name,
          inPlayMode: selectionIsLocked && selectedName == cmp.name,
        }"
      >
      <span>{{cmp.name}}</span>
      <span>{{cmp.rating}}</span>
    </div>
  </div>
`


export default {
  name: 'WizFace',
  props: ['cmp', 'selectedName', 'selectionIsLocked', 'score', 'scoreMode', 'topFeat'],
  template,
  style: css,
  functional: true,
}


// const style = css`
//   .king {
//     height: 2.5rem;
//     width: auto;
//     position: absolute;
//     opacity: .90;
//     top: 7.7rem;
//     left: 0.5rem;
//     z-index: 3;
//   }

//   .score {
//       font-size: .7rem;
//       width: auto;
//       position: absolute;
//       opacity: .75;
//       top: 9.0rem;
//       left: 1rem;
//       z-index: 4;
//   }

//   .score-even {
//     font-size: .7rem;
//     width: auto;
//     position: absolute;
//     opacity: .75;
//     top: 9.0rem;
//     left: 1.4rem;
//     z-index: 4;
//   }

//   @media screen and (max-width: 1080px) {
//     .king {
//       top: 9.9rem;
//       left: 1rem;
//     }

//     .score {
//       top: 11.2rem;
//       left: 1.5rem;
//     }

//     .score-even {
//       top: 11.2rem;
//       left: 1.85rem;
//     }
//   }
// `
// cssLoader.addStyle(style)