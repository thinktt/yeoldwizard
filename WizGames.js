import {html, css} from './pageTools.js'
import games from './games.js'


const template = html`
  <div v-if="games.length" class="games">
    <h1>Games with {{cmpName}}</h1>
    <div v-for="game in games" class="board-and-nav-box">
      <a :href="game.link" target="_blank" rel="noopener noreferrer">
        <wiz-board :nav-is-on="false" :id="game.id" :moves="game.moves" :color-side="game.playedAs">
        </wiz-board> 
      </a>
      <div class="game-info-box">
        <div v-if="game.conclusion ==='draw'">
          <img class="king" src="images/king-draw.png">
        </div>
        <div v-if="game.conclusion === 'won'">
          <img class="king" src="images/king-won.png">
        </div>
        <div v-if="game.conclusion === 'lost'">
          <img class="king" src="images/king-lost.png">
        </div>
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
  <div v-else class="games">
    <h1> Loading your games with {{cmpName}}...</h1>
    <div class="icon knight spin">♞</div>
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