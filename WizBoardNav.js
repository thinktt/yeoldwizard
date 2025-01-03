import { html } from './pageTools.js'
import sounds from './sounds.js'

const demoView = html`
  <div class="board-nav" :class="{'hide-on-desktop': endMessageIsOn}">
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
    <div class="nav-buttons demo">
      <button  v-if="soundIsMuted" title="toggle sound" class="sound-button off" @click="toggleSound">
        &#xe60c;
      </button>
      <button v-else title="toggle sound" class="sound-button on" @click="toggleSound">
        &#xe60d;
      </button>
      <button @click="$emit('start-demo')" title="play demo">
        4
      </button>
      <button @click="$emit('stop-demo')" title="pause demo">
        6
      </button>
      <button @click="$emit('route-back')" title="back" class="phone-nav" >
        &#xe05c;
      </button>
    </div>

    <wiz-game-end v-if="endMessageIsOn && isInPhoneMode()">
    </wiz-game-end>
  </div>
  <wiz-game-end v-if="endMessageIsOn" class="show-on-desktop">
  </wiz-game-end>
`

const normalView = html`
  <div class="board-nav" :class="{'hide-on-desktop': endMessageIsOn}">
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
    
        <button title="resign" @click="comfirmMessage = 'Resign'" id="resign-button">
          &#xe9cc;
        </button>

        <button  v-if="soundIsMuted" title="toggle sound" class="sound-button off" @click="toggleSound">
          &#xe60c;
        </button>
        <button v-else title="toggle sound" class="sound-button on" @click="toggleSound">
          &#xe60d;
        </button>

        <button title="offer draw"  
          :class="{disabled: drawsAreOnHold}"
          @click="drawsAreOnHold ? null : comfirmMessage = 'Offer Draw'" 
          id="offer-draw-button"> 
          &#xe904;
        </button>

        <button v-if="isInPhoneMode" title="reload" class="reload-button phone-nav" @click="reload">
          r
        </button>
      </template>
    
      <template v-else-if="!comfirmMessage && !isWaiting">
        <button @click="$emit('route-back')" title="back" class="phone-nav" >
          &#xe05c;
        </button>

        <button @click="comfirmMessage = 'Abort Game'" id="abort-button" title="abort game">&#xea0e;</button>
        
        <button  v-if="soundIsMuted" title="toggle sound" class="sound-button off" @click="toggleSound">
          &#xe60c;
        </button>
        <button  v-else title="toggle sound" class="sound-button on" @click="toggleSound">
          &#xe60d;
        </button>
        <button v-if="isInPhoneMode" title="reload" class="reload-button" @click="reload">
          r
        </button>
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
    
    <div v-if="game.status !=='started'" class="option-buttons">
      <button @click="$emit('route-back')" title="back" class="lichess-button phone-nav" >
        &#xe05c;
      </button>
      <button  title="view on Lichess" class="lichess-button" @click="openGame">
        &#xe901;
      </button>
     
      <button  v-if="soundIsMuted" title="toggle sound" class="sound-button off" @click="toggleSound">
        &#xe60c;
      </button>
      <button  v-else title="toggle sound" class="sound-button on" @click="toggleSound">
        &#xe60d;
      </button>

      <button v-if="isInPhoneMode" title="reload" class="reload-button" @click="reload">
        r
      </button>
      
    </div>
    <wiz-game-end v-if="endMessageIsOn || isInPhoneMode()">
    </wiz-game-end>
  </div>
  <wiz-game-end v-if="endMessageIsOn" class="show-on-desktop">
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
      soundIsMuted: getSoundIsMuted()
    }
  },
  inject: ['showEndMessage', 'endMessageIsOn', "isInPhoneMode"],
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
    navIndex(newIndex, oldIndex) {
      this.playSound(newIndex, oldIndex)
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
      const url = 'https://lichess.org/' + this.game.lichessId + '/' + this.game.playedAs
      console.log(url)
      window.open(url, '_blank')
    },
    playSound(index, oldIndex) {
      window.toggleSound = this.toggleSound
      if (this.soundIsMuted) return 

      const move = this.algebraMoves[index-1]
      if (!move) return 

      const isNextMove = (index - oldIndex) === 1
      if (!isNextMove) {
        return 
      }

      const isCapture = move.includes('x')
      if (isCapture) {
        playCaptureSound()
        return 
      }
    
      playMoveSound() 
    },
    toggleSound() {
      if (this.soundIsMuted) {
        this.soundIsMuted = false
        setSoundIsMuted(false)
        return 
      }

      this.soundIsMuted = true
      setSoundIsMuted(true) 
    },
    reload() {
      window.location.reload()
    } 
  },
  name: 'WizBoardNav',
  template,
}

// const captureSound = new Audio('sounds/Capture.mp3')
// const moveSound = new Audio('sounds/Move.ogg')

function playMoveSound() {
  sounds.play('move')
    // moveSound.pause()
    // moveSound.currentTime = 0
    // moveSound.play()
}

function playCaptureSound() {
  sounds.play('capture')
  // captureSound.pause()
  // captureSound.currentTime = 0
  // captureSound.play()
}

function setSoundIsMuted(state) {
  localStorage.soundIsMuted = state
}

function getSoundIsMuted() {
  if (localStorage.soundIsMuted && localStorage.soundIsMuted === 'true') {
    return true
  }
  return false
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