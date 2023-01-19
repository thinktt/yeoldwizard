import { html } from './pageTools.js'

const template = html`
  <div v-if="game.status === 'started'" class="game-status">
      <div class="game-link"> 
      <a :href="game.link + '/' + game.playedAs" target="_blank" rel="noopener noreferrer">
        play on lichess
      </a>
    </div>
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
    <p v-if="shouldShowPlayedAs">You played as {{game.playedAs}}</p>
    <p v-if="game.status === 'resign'">
        You
        <span>{{game.conclusion}}</span> 
        by resignation
    </p>
    <p v-else-if="game.status === 'draw' || game.status === 'stalemate'">
        draw by {{game.drawType}}
    </p>
    <p v-else>
      You
      <span> {{game.conclusion}}</span> 
      by {{game.status}}
    </p>
    <p>{{(new Date(game.lastMoveAt)).toDateString()}}</p>
    <div class="game-link"> 
      <a :href="game.link + '/' + game.playedAs" target="_blank" rel="noopener noreferrer">
        view on lichess
      </a>
    </div>
</div>
`


export default {
  props: ['game', "shouldShowPlayedAs"],
  template,
}