import {html, css} from './pageTools.js'


const template =  html`
  <div> 
    <wiz-king 
      :cmpName="cmp.name"
      :score="score"
      :score-mode="scoreMode"
      :top-feat="topFeat"
      >
    </wiz-king>

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