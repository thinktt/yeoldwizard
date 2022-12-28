import {html, css} from './pageTools.js'
import games from './games.js'


const template = html`
  <div v-if="games.length">
    <div v-for="game in games" class="board-and-nav-box">
      <!-- <a :href="game.link">{{game.id}}</a> -->
      <wiz-board :nav-is-on="true" :id="game.id" :moves="game.moves">
      </wiz-board> 
    </div>
  </div>
`

export default {
  data() {

    return {
      games: [],
      moves: [],
    }
  },
  async created() {
    await new Promise(r => setTimeout(r, 1000))
    this.games = await games.getGamesWithMoves('Orin')
    // this.moves = theseGames[0].moves.split(' ')
  },
  template,
}