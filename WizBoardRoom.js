import {html, css} from './pageTools.js'
import games from './games.js'


const template = html`
  <div class="board-room">
    <div class="board-and-nav-2"> 
      <wiz-board-2 id="main-board" :moves="game.moves" :color-side="game.playedAs">
      </wiz-board-2>
      <wiz-board-nav :moves="game.moves" navIndex="3">
      </wiz-board-nav>
    </div>
  </div>
`


export default {
  props: ['game'],
  template,
}