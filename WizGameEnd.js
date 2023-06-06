import { html } from './pageTools.js'


const template = html`
  <Transition name="slide">
    <div v-if="endMessageIsOn" class="slider-box"> 
      <div v-if="score === 2 && groupHasTrophy && game.conclusion === 'won'" 
        class="game-done-message won trophy-win">
        <wiz-game-status v-if="game" :game="game"></wiz-game-status>
        <p>
          Congratulations! You conquered {{groupDisplayName}} by getting every Trophy Point 
          <span  class="inline-trophy">t</span> <br>
        </p>
        <h2  class="you-won">YOU WON</h2>
        <img class="trophy-piece-end" :class="groupTrophy" :src="trophyImageUrl">
        <h2 class="color-highlight-gold-1">{{goldenTrophyDisplayMessage}}</h2>
        <a class="button yellow" @click="hideEndMessage">ok</a>
      </div>  

      <div v-else class="game-done-message" 
        :class="{draw: game.conclusion === 'draw', won: game.conclusion === 'won', lost: game.conclusion === 'lost'}">
        <wiz-game-status v-if="game" :game="game">
        </wiz-game-status>
        <p v-if="demoIsOn || winCount === 1 && game.conclusion === 'won'">
        <span class="color-highlight">
          YOU WON
        </span>   
          a pawn badge <span  class="pawn-won">♙</span>
          for beating {{this.game.opponent}} for the first time
        </p>
        <p v-else>
          <span class="color-highlight-">
            Your score
          </span>   
          with {{this.game.opponent}} is now 
          <span v-if="score === 0" class="inline-score even">EVEN</span>
          <span v-if="score > 0" class="inline-score up">+{{score}}</span>
          <span v-if="score < 0" class="inline-score down">{{score}}</span>
          <span v-if="demoIsOn" class="inline-score up">+1</span>
        </p>

        <p v-if="groupHasTrophy">
          <span class="color-highlight-green">
            NEXT GOAL 
          </span> <br>
          You've conquered {{groupDisplayName}},  and won the 
          <span class="color-highlight-gold-1">
            {{goldenTrophyDisplayMessage}}
          </span>. Play the next group to collect more golden pieces.
        </p>

        <p v-else-if="winCount < 1">
          <span class="color-highlight-green">
            NEXT GOAL 
          </span> <br>    
          Beat {{this.game.opponent}} to win <br> 
          The Pawn Badge<span  class="pawn-won">♙</span>
        </p>

        <p v-else-if="score < 2">
          <span class="color-highlight-green">
            NEXT GOAL
          </span> <br> 
          Score <span class="inline-score">+2</span>
          against {{this.game.opponent}} to win a trophy point 
          <span  class="inline-trophy">t</span>
        </p>

        <p v-else>
          <span class="color-highlight-green">
            NEXT GOAL 
          </span> <br>
          Win all the trophy points  <span  class="inline-trophy">t</span>
          for {{groupDisplayName}} to win <br><br> 
          <span class="color-highlight-gold">
            {{goldenTrophyDisplayMessage}}
          </span>
        </p>

        <a class="button yellow" @click="hideEndMessage">ok</a>
      </div>
    </div>
  </Transition>
`

export default {
  data: () => ({
    sliderIsUp: false,
    messageIsVissible: false,
  }),
  inject: ['score', 'topFeat', 'winCount', 'groupTitle', 'groupTrophy', 
  'groupHasTrophy', 'game', 'endMessageIsOn', 'hideEndMessage', 'demoIsOn'], 
  // updated() {
  //   if (this.messageIsVissible) this.sliderIsUp = true
  // },
  // watch: {
  //   endMessageIsOn() {
  //     if (this.endMessageIsOn) this.messageIsVissible = true
  //   }
  // },
  computed: {
    groupDisplayName() {
      if (!this.groupTitle) return ''
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
        case 'goldenking':
          return 'The Golden King'
        default:
          return ''
      }
    },
    trophyImageUrl() {
      let imageName = this.groupTrophy      
      return `images/${imageName}.png`
    },
  },
  template,
  name: 'WizGameEnd',
}

