import { html } from './pageTools.js'


const template = html`
  <div class="promotion-overlay">
    <div class="game-done-message drew">
      <wiz-game-status v-if="game" :game="game">
      </wiz-game-status>
      <p v-if="winCount === 1 && game.conclusion === 'won'">
        YOU WON a pawn badge <span  class="pawn-won">♙</span>
        for beating {{this.game.opponent}} for the first time
      </p>
      <p v-else>
        YOUR SCORE with {{this.game.opponent}} is now 
        <span v-if="score === 0" class="inline-score even">EVEN</span>
        <span v-if="score > 0" class="inline-score up">+{{score}}</span>
        <span v-if="score < 0" class="inline-score down">{{score}}</span>
      </p>
      <!-- <p>
         NEXT GOAL Beat {{this.game.opponent}} to win the Pawn Badge<span  class="pawn-won">♙</span>
      </p> -->
      <p>
        NEXT GOAL score
        <span class="inline-score">+2</span>
        against {{this.game.opponent}} to win a trophy point <span  class="inline-trophy">t</span>
      </p>
      <a class="button yellow">ok</a>
    </div>


    <!-- <div v-if="score === 2 && groupHasTrophy && gameConclusion === 'won'" 
      class="game-done-message won trophy-win">
      <h2>Congradulation!</h2>
      <p>
        You conqured {{groupDisplayName}} by getting every Trophy Point 
        <span  class="inline-trophy">t</span> <br>
      </p>
      <h2>YOU WON</h2>
      <img class="trophy-piece-end" :src="trophyImageUrl">
      <h2>{{goldenTrophyDisplayMessage}}</h2>
      <a class="button yellow">ok</a>
    </div>   -->

    <!-- <div v-else class="game-done-message won trophy-win">
      <p>
        {{score}} <br>
        {{topFeat}} <br>
        {{groupTitle}} <br>
        {{groupTrophy}} <br>
        {{gameConclusion}} <br>
        {{opponent}} <br>
        {{drawType}} <br>
        hasTrophy {{groupHasTrophy}} <br>

      </p>
    </div> -->
  </div>
`

export default {
  inject: ['score', 'topFeat', 'winCount', 'groupTitle', 'groupTrophy', 
    'groupHasTrophy', 'game'], 
  computed: {
    groupDisplayName() {
      const displayName = this.groupTitle.includes('the') ? 
          this.groupTitle.replace('The', 'the') : `the ${this.groupTitle}`
      return displayName
    },
    goldenTrophyDisplayMessage() {
      switch(this.groupTrophy) {
        case 'goldenpawn':
          return 'The Golden Pawn'
        case 'goldenrook':
          return 'The Golden Rook'
        case 'goldenbishop':
          return 'The Golden Bishop'
        case 'goldenknight':
          return 'The Golden Knight'
        case 'goldenqueen':
          return 'The Golden Queen'
        case 'goldKing':
          return 'The Golden King'
        default:
          return ''
      }
    },
    trophyImageUrl() {
      let imageName = this.groupTrophy      
      if (imageName == 'goldenpawn') imageName= 'goldenpawn-short'
      return `images/${imageName}.png`
    },
  },
  template,
  name: 'WizGameEnd',
}

