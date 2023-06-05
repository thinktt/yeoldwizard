import { html } from './pageTools.js'

const demoView = html`
  <div class="board-nav">
    <h2 class="wiz-kid-name">{{game.opponent}}</h2>
    <div class="pgn-viewer">
      <template v-for="(move, index) in algebraMoves">
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

    <div v-if="demoIsOn" class="demo-message" >DEMO played by</div>
    <div v-else class="nav-buttons">
      <button @click="$emit('goStart')" id="go-start-button">s</button>
      <button @click="$emit('goBack')" id="go-back-button">p</button>
      <button @click="$emit('goForward')" id="go-forward-button">n</button>
      <button @click="$emit('goEnd')" id="go-end-button">l</button>
    </div>

    <h2 class="user-name">{{userName}}</h2>
      
    <wiz-game-status :game="game" :do-pop-spin="doPopSpin"></wiz-game-status>

    <div v-if="demoIsOn">
      <a  class="button yellow demo" @click="$emit('stop-demo')">Stop Demo</a>
    </div>
    <div v-if="!demoIsOn && !demoIsRunning">
      <a  class="button yellow demo" @click="$emit('start-demo')">Start Demo</a>
    </div>

    <div class="nav-buttons phone-nav">
      <button @click="$emit('route-back')" title="back" class="phone-nav" >
        &#xe05c;
      </button>
    </div>

  </div>
`

const normalView = html`

  <div class="board-nav">
    <h2 class="wiz-kid-name">{{game.opponent}}</h2>
    <div class="pgn-viewer">
      <template v-for="(move, index) in algebraMoves">
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
      

    <div v-if="shouldShowActions" class="nav-buttons lower">
      <template v-if="game.moves.length > 1 && !comfirmMessage && !isWaiting">
        <button @click="$emit('route-back')" title="back" class="phone-nav" >
          &#xe05c;
        </button>

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
        <button @click="$emit('route-back')" title="back" class="phone-nav" >
          &#xe05c;
        </button>
        <button title="view on Lichess" class="lichess-button" @click="openGame">
          &#xe901;
        </button>
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

    <wiz-game-status @click="showEndMessage" :game="game" :do-pop-spin="doPopSpin">
    </wiz-game-status>
    
    <div v-if="game.status !=='started'">
      <button @click="$emit('route-back')" title="back" class="lichess-button phone-nav" >
        &#xe05c;
      </button>
      <button  title="view on Lichess" class="lichess-button" @click="openGame">
        &#xe901;
      </button>
    </div>
  </div>
  <wiz-game-end>
  </wiz-game-end>
`

const template = html`
  <div v-if="game.demoPlayer">
    ${demoView}
  </div>
  <div v-else>
    ${normalView}
  </div>
`

export default {
  props : [
    'game', 'algebraMoves', 'navIndex', 'userName', 'drawOfferState', 
    'demoIsOn', 'demoIsRunning',
  ],
  data() {
    return {
      comfirmMessage: '',
      shouldShowActions: true,
      moveOfDrawOffer: 0,
      drawWasOffered: false,
      isWaiting: false,
      doPopSpin: false, 
    }
  },
  inject: ['showEndMessage', 'endMessageIsOn'],
  beforeUpdate() {
    if (this.game.status === 'started') this.shouldShowActions = true
      else this.shouldShowActions = false
  },
  computed: {
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
    },
    async 'game.status'(newStatus, oldStatus) {
      // create an animation any time the game status goes from started to a conclusion
      if (oldStatus === 'started' && this.game.hasJustEnded) {
        this.doPopSpin = true
        await new Promise(r => setTimeout(r, 500))
        this.doPopSpin = false
      }
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