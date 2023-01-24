import games from './games.js'
import { html } from './pageTools.js'

const template = html`
  <div v-if="game.status === 'started'" class="game-status">
      <!-- <div class="game-link"> 
      <a :href="game.link + '/' + game.playedAs" target="_blank" rel="noopener noreferrer">
        play on lichess
      </a>
    </div> -->
  </div>

  <div v-else class="game-status">
    <div v-if="game.conclusion ==='draw'">
      <img class="king" src="images/king-draw.png">
    </div>
    <div v-if="game.conclusion === 'won'">
      <img class="king" src="images/king-won.png">
    </div>
    <div v-if="game.conclusion === 'lost'">
      <img class="king" src="images/king-lost.png">
    </div>
    <p v-if="shouldShowPlayedAs">You played as {{playedAs}}</p>
    <p v-if="game.status === 'resign'">
        You
        <span>{{game.conclusion}}</span> 
        by Resignation
    </p>
    <p v-else-if="game.status === 'draw' || game.status === 'stalemate'">
        Draw by {{drawType}}
    </p>
    <p v-else>
      You
      <span> {{game.conclusion}}</span> 
      by {{status}}
    </p>
    <p>{{(new Date(game.lastMoveAt)).toDateString()}}</p>
</div>
`


export default {
  props: ['game', "shouldShowPlayedAs"],
  template,
  computed : {
    playedAs() {
      if (!this.game.playedAs) return 
      return this.game.playedAs[0].toUpperCase() +  this.game.playedAs.substring(1)
    },
    drawType() {
      switch(this.game.drawType) {
        case 'material':
          return 'Insuficient Material'
          break;
        case 'stalemate':
          return 'Stalemate'
          break;
        case 'threefold':
          return 'Three Fold Repetition'
          break;
        case 'fiftyMove':
          return 'Fifty Move Rule'
          break;
        case 'mutual':
          return 'Mutual Agreement'
          break;
      }
    },
    status() {
      switch(this.game.status) {
        case 'mate':
          return 'Checkmate'
          break;
        default: 
          return this.game.status
      }
    }
  }
}