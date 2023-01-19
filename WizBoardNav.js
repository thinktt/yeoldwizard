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
      <template v-if="game.moves.length > 1 && !comfirmMessage">
        <button @click="comfirmMessage = 'Resign'" id="resign-button" title="resign">&#xe9cc;</button>
        <button @click="comfirmMessage = 'Offer Draw'" id="offer-draw-button" title="offer draw">&#xe904;</button>
      </template>
      <template v-else-if="!comfirmMessage">
        <button @click="comfirmMessage = 'Abort Game'" id="abort-button" title="abort game">&#xea0e;</button>
      </template>
      <template v-if="comfirmMessage">
        <div>{{comfirmMessage}}?</div>
        <button @click="comfirmMessage = ''" id="no-button" title="no">&#xe902;</button>
        <button @click="doComfirmAction(comfirmMessage)" id="yes-button" title="yes">&#xea10;</button>
      </template>
    </div>

    <wiz-game-status :game="game"></wiz-game-status>

  </div>
`

export default {
  props : ['game', 'navIndex', 'userName'],
  data() {
    return {
      comfirmMessage: '',
      shouldShowActions: false,
    }
  },
  computed: {
    gameHistory() {
      const game = new Chess() 
      for (const move of this.game.moves) {
        game.move(move) 
      }
      return game.history()
    }
  },
  watch: {
    navIndex() {
      if (this.game.status === 'started') this.shouldShowActions = true
        else this.shouldShowActions = false
      this.comfirmMessage = ''
    }
  },
  methods: {
    doComfirmAction(action) {
      if (action === 'Resign') this.$emit('quitAction', 'resign')
      if (action === 'Offer Draw') this.$emit('quitAction', 'offerDraw')
      if (action === 'Abort Game') this.$emit('quitAction', 'abort')
      this.comfirmMessage = ''
      this.shouldShowActions = false
    }
  },
  name: 'WizBoardNav',
  template,
}

