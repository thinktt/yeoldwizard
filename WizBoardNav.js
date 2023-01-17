import { html } from './pageTools.js'



const template = html`
  <div class="board-nav">
    <h2>{{game.opponent}}</h2>
    <div class="pgn-viewer">
      <template v-for="(move, index) in gameHistory">
        <span v-if="index % 2 === 0" class="move-number">{{index / 2 + 1}}.</span>
        <span 
          :class="{highlight: navIndex - 1 === index}" 
          @click="$emit('goIndex', index)" 
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
    <h2>{{userName}}</h2>
    <wiz-game-status :game="game"></wiz-game-status>
  </div>
`

export default {
  props : ['game', 'navIndex', 'userName'],
  data() {
    return {}
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
  name: 'WizBoardNav',
  template,
}

