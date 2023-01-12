import { html } from './pageTools.js'



const template = html`
  <div class="board-nav">
    <div class="pgn-viewer">
      <template v-for="(move, index) in gameHistory">
        <span v-if="index % 2 === 0" class="move-number">{{index / 2 + 1}}.</span>
        <span :class="{highlight: navIndex - 1 === index}" class="half-move">
          {{move}}
        </span> 
      </template>
    </div>
    <button @click="$emit('goStart')" id="go-start-button">Go Start</button>
    <button @click="$emit('goBack')" id="go-back-button">Go Back</button>
    <button @click="$emit('goForward')" id="go-forward-button">Go Forward</button>
    <button @click="$emit('goEnd')" id="go-end-button">Go End</button>
  </div>
`

export default {
  props : ['moves', 'navIndex'],
  data() {
    return {}
  },
  computed: {
    gameHistory() {
      const game = new Chess() 
      for (const move of this.moves) {
        game.move(move) 
      }
      return game.history()
    }
  },
  name: 'WizBoardNav',
  template,
}

