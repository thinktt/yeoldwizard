import {html, css} from './pageTools.js'
import { Chessground } from './lib/chessground/js/chessground.js'
const chess = new Chess()


let boardQue = []
let boardsAreRendering  = false

const template =  html`
  <div class="board-container">
    <div :id="id"></div>
  </div>
`

export default {
  props : [ 'isEager', 'navIsOn', 'id', 'moves', 'colorSide', 'endFen' ],
  data() {
    return {
      checkSquare: null,
    }
  },
  unmounted() {
    // clear the boardQue
    boardQue = []
  },
  mounted: function() {
    const config = {
      orientation: this.colorSide,  
      turnColor: this.colorSide,
      // viewOnly: true,
      coordinates: false,
      // fen: this.game.fen(),
      // fen: this.endFen,
      // check: checkColor, 
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
    }
    const board = { id: this.id, moves: this.moves, config }
    if (this.isEager) {
      renderBoard(board)
      return
    }

    queBoard(board)
    renderBoards()
  },
  methods: {
    onMove(from, to) {},
  },
  name: 'WizBoard',
  template,
}


// these function are used to load all the chess ground boards withoug blocking 
// the even loop by loading a board on every even loop using setTimeout
function queBoard(config) {
  boardQue.push(config)
}

async function renderBoards() {
  if (boardsAreRendering) return
  boardsAreRendering = true
  while(boardQue.length) {
    renderNextBoard()
    await new Promise(r => setTimeout(r, 0))
  }
  boardsAreRendering = false
}

function renderNextBoard() {
  const board = boardQue.shift()
  renderBoard(board)
}

function renderBoard(board) {
  chess.reset()
  for (const move of board.moves) {
    chess.move(move) 
  }

  board.config.fen = chess.fen()
  if (chess.in_check()) {
    board.config.check = chess.turn() === 'w' ? 'white' : 'black'
  }
  Chessground(document.getElementById(board.id), board.config)
}