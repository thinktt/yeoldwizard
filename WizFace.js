// import { html, render } from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js'
import html from './html.js'
const res = await fetch('personalities.json')
const cmpsObj = await res.json()

const cmp = cmpsObj['Joey']



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
  functional: true,
  // data() {
  //   return {
  //     selected: {name: 'Joey'},
  //     selectionIsLocked : false,
  //   }
  // },
  // methods: {
  //   showCmp(cmp) {
  //     console.log('showCmp')
  //   },
  //   toggleSelectionLock(cmp) {
  //     console.log('toggleSelectionLock')
  //   }
  // }
}














// const litFace = html`
//   <div class="cmp">
//     <a :name="cmp.name"></a>
//     <img class="face" src=${'images/faces/' + cmp.face} alt=${cmp.name}
//       @mouseover=${() => showCmp(cmp)} 
//       @click=${() => toggleSelectionLock(cmp)}

//     >
//     <span>${cmp.name}</span>
//     <span>${cmp.rating}</span>
//   </div>
// `

// const wizFace = document.querySelector('wiz-header') 
// function doRender() {
//   render(html, wizFace)
// }



// // figure conditonal class stuff later
// // :class="{
// //   selected: selected.name === cmp.name,
// //   inPlayMode: selectionIsLocked && selected.name == cmp.name,
// // }"



// function showCmp(cmp) {
//   console.log('showCmp triggered') 
// }

// function toggleSelectionLock(cmp) {
//   console.log('toggleSelectionLock triggerd')
// }

// const template = html`
//   <div v-for="cmp of group.cmps" class="cmp-container" :title="cmp.summary">
                
//   <span v-if="scoreMode == 'score'">
//     <span v-if="games[cmp.name] && games[cmp.name].score >= 1" >
//       <span class="score">{{games[cmp.name].score}}</span>
//       <img 
//         :title="\`You've beaten \${cmp.name}\`"
//         class="king" 
//         src="images/king-won.png" 
//         alt="won"
//       >
//     </span>
//     <span v-if="games[cmp.name] && games[cmp.name].score < 0">
//       <span class="score">{{games[cmp.name].score}}</span>
//       <img 
//         :title="\`\${cmp.name} has always beaten you\`"
//         class="king" 
//         src="images/king-lost.png" 
//         alt="lost"
//       >
//     </span>
//     <span v-if="games[cmp.name] && games[cmp.name].score === 0 ">
//       <span class="score-even">EVEN</span>
//       <img
//         :title="\`Your best is a draw with \${cmp.name}\`"
//         class="king" 
//         src="images/king-draw.png" 
//         alt="draw"
//       >
//     </span> 
//   </span>

//   <span v-if="scoreMode == 'ladder'">
//     <span v-if="games[cmp.name] && games[cmp.name].topFeat === 'won'">
//       <img 
//         :title="\`You've beaten \${cmp.name}\`"
//         class="king" 
//         src="images/king-won.png" 
//         alt="won"
//       >
//     </span>
//     <img v-if="games[cmp.name] && games[cmp.name].topFeat === 'lost'"
//       :title="\`\${cmp.name} has always beaten you\`"
//       class="king" 
//       src="images/king-lost.png" 
//       alt="lost"
//     >
//     <img v-if="games[cmp.name] && games[cmp.name].topFeat === 'draw'"
//       :title="\`Your best is a draw with \${cmp.name}\`"
//       class="king" 
//       src="images/king-draw.png" 
//       alt="draw"
//     >
//   </span>

//   <div class="cmp">
//     <a :name="cmp.name"></a>
//     <img class="face" :src="'images/faces/' + cmp.face" alt="cmp.name"
//       @mouseover="showCmp(cmp)" 
//       @click="toggleSelectionLock(cmp)"
//       :class="{
//         selected: selected.name === cmp.name,
//         inPlayMode: selectionIsLocked && selected.name == cmp.name,
//       }"
//     >
//     <span>{{cmp.name}}</span>
//     <span>{{cmp.rating}}</span>
//   </div>

//   </div>
// `