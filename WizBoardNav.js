import { html } from './pageTools.js'



const template = html`
  <div class="board-nav">
    <h2 class="wiz-kid-name">{{game.opponent}}</h2>
    <div class="pgn-viewer">
      <template v-for="(move, index) in gameHistory">
        <span v-if="index % 2 === 0" class="move-number">{{index / 2 + 1}}.</span>
        <span 
          :class="{highlight: navIndex - 1 === index}" 
          @click="$emit('goIndex', index)" 
          :id="'move' + (index + 1)"
          class="half-move">
            {{move}}
        </span> 
      </template>
    </div>

    <div class="nav-buttons">
      <button @click="$emit('goStart')" id="go-start-button">s</button>
      <button @click="$emit('goBack')" id="go-back-button">p</button>
      <button @click="$emit('goForward')" id="go-forward-button">n</button>
      <button @click="$emit('goEnd')" id="go-end-button">l</button>
    </div>
    <h2 class="user-name">{{userName}}</h2>
      

    <div v-if="shouldShowActions" class="nav-buttons">
      <!-- <a :href="'https://lichess.org/' + game.id + '/' + game.playedAs" target="_blank" rel="noopener noreferrer">
        &#xe901;
      </a> -->
 
      <template v-if="game.moves.length > 1 && !comfirmMessage && !isWaiting">
        <button class="lichess-button" @click="openGame" title="play on Lichess">
          &#xe901;
        </button>

        <button title="resign" @click="comfirmMessage = 'Resign'" id="resign-button">&#xe9cc;</button>
        
        <button title="offer draw"  
          :class="{disabled: drawsAreOnHold}"
          @click="drawsAreOnHold ? null : comfirmMessage = 'Offer Draw'" 
          id="offer-draw-button"> 
          &#xe904;
        </button>
      </template>
    
      <template v-else-if="!comfirmMessage && !isWaiting">
        <button @click="comfirmMessage = 'Abort Game'" id="abort-button" title="abort game">&#xea0e;</button>
      </template>
    
      <template v-if="comfirmMessage">
        <div>{{comfirmMessage}}?</div>
        <button title="no" @click="comfirmMessage = ''" id="no-button"> &#xe902;</button>
        <button title="yes" @click="doComfirmAction(comfirmMessage)" id="yes-button">&#xea10;</button>
      </template>

      <div v-if="drawOfferState === 'declined'" class="nav-message">
        {{this.game.opponent}} declined your draw offer
      </div>
      <div v-if="drawOfferState === 'offered' || isWaiting" class="icon knight spin">
        ♞
      </div>
    
    </div>
    <wiz-game-status :game="game"></wiz-game-status>

    <button title="view on Lichess" class="lichess-button" @click="openGame">
      &#xe901;
    </button>
    
    <div v-if="game.status !== 'started'" class="nav-buttons">
    </div>
  </div>
`

export default {
  props : ['game', 'navIndex', 'userName', 'drawOfferState'],
  data() {
    return {
      comfirmMessage: '',
      shouldShowActions: true,
      moveOfDrawOffer: 0,
      drawWasOffered: false,
      isWaiting: false,
    }
  },
  beforeUpdate() {
    if (this.game.status === 'started') this.shouldShowActions = true
      else this.shouldShowActions = false
  },
  computed: {
    gameHistory() {
      const game = new Chess() 
      for (const move of this.game.moves) {
        game.move(move) 
      }
      return game.history()
    },
    drawsAreOnHold() {
      const movesSinceDrawOffer = this.game.moves.length - this.moveOfDrawOffer
      return this.moveOfDrawOffer !==0 && movesSinceDrawOffer < 22
    }
  },
  watch: {
    navIndex() {
      this.comfirmMessage = ''
    },
    'game.moves'() {
      const movesSinceDrawOffer = this.game.moves.length - this.moveOfDrawOffer
      if (movesSinceDrawOffer === 2) this.$emit('quitAction', 'clearDrawOffer') 
    },
    'game.id'() {
      console.log(`loading ${this.game.id} into play board`)
      this.comfirmMessage = ''
      this.shouldShowActions = true
      this.moveOfDrawOffer = 0
      this.drawWasOffered = false
      this.isWaiting = false
      this.$emit('quitAction', 'clearDrawOffer')
    }
 },
  methods: {
    doComfirmAction(action) {
      if (action === 'Offer Draw') {
        this.$emit('quitAction', 'offerDraw')
        this.drawWasOffered = true
        this.moveOfDrawOffer = this.game.moves.length
        this.comfirmMessage = ''
        return 
      }

      if (action === 'Resign') this.$emit('quitAction', 'resign')
      if (action === 'Abort Game') this.$emit('quitAction', 'abort')
      this.isWaiting = true
      this.comfirmMessage = ''
    },
    openGame() {
      const url = 'https://lichess.org/' + this.game.id + '/' + this.game.playedAs
      console.log(url)
      window.open(url, '_blank')
    }
  },
  name: 'WizBoardNav',
  template,
}


// const movesSinceDrawOffer = this.game.moves.length - this.moveOfDrawOffer
// const drawHasBeenOfferd = this.drawOfferState === 'offered'
// const drawWasDeclined = this.drawOfferState === 'delcined'
// console.log(movesSinceDrawOffer, drawHasBeenOfferd, drawWasDeclined)
// if (drawHasBeenOfferd && movesSinceDrawOffer >= 2) {
//   console.log('draw offer is being ingored')
//   this.$emit('quitAction', 'drawWasIgnored')
// }

// if (drawWasDeclined && movesSinceDrawOffer >= 2) {
//   console.log('clearing draw offer')
//   this.$emit('quitAction', 'clearDrawOffer')
// }

// <!-- <div v-if="drawOfferState === 'offered'">
// You offered a Draw
// </div> -->
// <!-- <div v-if="drawOfferState === 'ignored'" class="nav-message">
// Draw offeres are not being accpeted righ now, make more moves and try again later
// </div> -->