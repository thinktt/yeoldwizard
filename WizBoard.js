import {html, css} from './pageTools.js'
import { Chessground } from './lib/chessground/js/chessground.js'
// import { configure } from './lib/chessground/js/config.js'


const template =  html`
  <div class="board-container">
    <div :id="id"></div>
  </div>
`


export default {
  props : [ 'navIsOn', 'id', 'moves', 'colorSide' ],
  data() {
    return {
      checkSquare: null,
    }
  },
  mounted: function() {
    this.game = new Chess()
    for (const move of this.moves) {
      this.game.move(move) 
    }
    let checkColor = null
    if (this.game.in_check()) {
      checkColor = this.game.turn() === 'w' ? 'white' : 'black'
    }
    window.chess = this.game
    this.checkSquare = this.game.fen()
    this.gameHistory = this.game.history()
    window.gameHistory = this.gameHistory
    this.navIndex = this.gameHistory.length
    this.cg = Chessground(document.getElementById(this.id), {
      orientation: this.colorSide,  
      turnColor: this.colorSide,
      // viewOnly: true,
      coordinates: false,
      fen: this.game.fen(),
      check: checkColor, 
      movable: {
        free: false,
        // color: 'white',
        // dests: getLeglaMoves(this.game),
        showDests: false,
        events: {
          after: this.onMove
        }
      },
      premovable: {
        enabled: false,
        showDests: false,
      },
      draggable: {
        enabled: false,
      },
      selectable: {
        enabled: false,
      },
      drawable: {
        enabled: false,
      },
      animation: { 
        enabled: true 
      },
    })
    window.cg = this.cg
  },
  methods: {
    onMove(from, to) {},
  },
  name: 'WizBoard',
  template,
}


function getLeglaMoves(game)  {
  const dests = new Map();
  game.SQUARES.forEach(s => {
    const ms = game.moves({square: s, verbose: true});
    if (ms.length) dests.set(s, ms.map(m => m.to));
  });
  return dests;
}

