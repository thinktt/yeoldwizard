import {html, css} from './pageTools.js'
import games from './games.js'


const template = html`
  <div v-if="games.length">
    <h1>Games with {{cmpName}}</h1>
    <div v-for="game in games" class="board-and-nav-box">
      <a :href="game.link" target="_blank" rel="noopener noreferrer">
        <wiz-board :nav-is-on="false" :id="game.id" :moves="game.moves" :color-side="game.playedAs">
        </wiz-board> 
      </a>
      <div class="game-info-box">
        <p>You played as {{game.playedAs}}</p>
        <p v-if="game.status === 'resign'">
            You
            <span>{{game.conclusion}}</span> 
            by resignation
        </p>
        <p v-else-if="game.status === 'draw'">
            Game was a draw
        </p>
        <p v-else>
          You
          <span> {{game.conclusion}}</span> 
          by {{game.status}}
        </p>
        <a :href="game.link" target="_blank" rel="noopener noreferrer">View on Lichess</a>
      </div>
    </div>
  </div>
`


export default {
  props: ['cmpName'],
  data() {
    return {
      games: [],
      moves: [],
    }
  },
  async created() {
    await new Promise(r => setTimeout(r, 1000))
    this.games = await games.getGamesWithMoves(this.cmpName)
    // this.moves = theseGames[0].moves.split(' ')
  },
  template,
}