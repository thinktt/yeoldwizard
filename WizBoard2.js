import {html, css} from './pageTools.js'
import { Chessground } from './lib/chessground/js/chessground.js'
// import { configure } from './lib/chessground/js/config.js'


const config = getPromoConfig('e8')
const { color, queenTop, roookTop, knightTop, bishopTop, leftOffset } = config
const pgnViewer = html`<div class="pgn-viewer"></div>`

const template =  html`
  <div class="board-container">
    <div :id="id"></div>
    <div class="promotion-overlay cg-wrap" :class="{hidden: !isPromoting}">
      <square @click="doPromotion('q')" :style="{top: queenTop + '%', left: leftOffset + '%'}">
        <piece class="queen" :class="color"></piece>
      </square>
      <square @click="doPromotion('n')" :style="{top: knightTop + '%', left: leftOffset + '%'}">
        <piece class="knight" :class="color"></piece>
      </square>
      <square @click="doPromotion('r')" :style="{top: roookTop + '%', left: leftOffset + '%'}">
        <piece class="rook" :class="color"></piece>
      </square>
      <square @click="doPromotion('b')" :style="{top: bishopTop + '%', left: leftOffset + '%'}">
        <piece class="bishop" :class="color"></piece>
      </square>
    </div>
  </div>
`


export default {
  props : [  'id', 'fen', 'colorSide', 'isLocked', 'lastMove','gameId' ],
  data() {
    const { 
      color, 
      queenTop, 
      roookTop, 
      knightTop, 
      bishopTop, 
      leftOffset,
    } = getPromoConfig('e8')

    return {
      color,
      queenTop,
      knightTop,
      roookTop,
      bishopTop,
      leftOffset,
      isPromoting: false,
      gameHistory: [],
      promoteFromSquare: null,
      promoteToSquare: null,
      navIndex: 0,
      checkSquare: null,
    }
  },
  mounted: function() {
    this.game = new Chess()
   
    this.cg = Chessground(document.getElementById(this.id), {
      // orientation: this.colorSide,  
      // turnColor: this.colorSide,
      // viewOnly: true,
      coordinates: false,
      // fen: this.game.fen(),
      // check: checkColor, 
      movable: {
        free: false,
        color: this.colorSide, //this.color,
        dests: getLegalMoves(this.game),
        showDests: false,
        events: {
          after: this.onMove
        }
      },
      premovable: {
        enabled: false,
        showDests: true,
      },
      draggable: {
        enabled: true,
      },
      selectable: {
        enabled: true,
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
  watch: {
    async gameId() {
      // console.log('new game on board')
      cg.set({ animation: { enabled: false } })
      await this.$nextTick()
      cg.set({ animation: { enabled: true } })
    },
    fen() {
      console.log(this.lastMove)
      this.game.reset()
      this.game.load(this.fen) 
      updateBoard(this.game, this.cg, this.isLocked, this.lastMove)
    },
    colorSide(color) {
      this.cg.set({ 
        orientation: color,
        movable: {
          color: color,
        } 
      })
    },
  },
  methods: {
    onMove(from, to) {
      if (isPromotion(from, to, this.game)) {
        this.cg.set({ animation: { enabled: false } })
        this.doPromoteRequest(from, to)
        return
      }
      this.$emit('move', from + to)
    },
    doPromoteRequest(from, to) {
      const config = getPromoConfig(to)
      this.promoteFromSquare = from
      this.promoteToSquare = to
      this.color = config.color
      this.queenTop = config.queenTop
      this.roookTop = config.roookTop
      this.knightTop = config.knightTop
      this.bishopTop = config.bishopTop
      this.leftOffset = config.leftOffset
      this.isPromoting = true
    },
    doPromotion(piece) {
      const from = this.promoteFromSquare
      const to = this.promoteToSquare
      this.game.move({ from, to, promotion: piece })
      const lastAlgebraMove = this.game.history().slice(-1)[0]
      updateBoard(this.game, this.cg, this.isLocked, this.lastMove)
      this.isPromoting = false
      const move = from + to + piece
      this.$emit('move', move)
    }, 
  },
  name: 'WizBoard',
  template,
}


function updateBoard(game, cg, isLocked, lastMove) {

  if (isLocked) {
    cg.set({
      draggable: { enabled: false },
      selectable: { enabled: false },
    })
  } else {
    cg.set({
      draggable: { enabled: true },
      selectable: { enabled: true },
    })
  }

  cg.set({ 
    fen: game.fen(),
    check: game.in_check(),
    movable: {
      // color: getTurn(game),
      dests: getLegalMoves(game),
    },
    turnColor: getTurn(game),
    lastMove,
  })
  cg.set({ animation: { enabled: true } })
}

function getLegalMoves(game)  {
  const dests = new Map();
  game.SQUARES.forEach(s => {
    const ms = game.moves({square: s, verbose: true});
    if (ms.length) dests.set(s, ms.map(m => m.to));
  });
  return dests;
}

function getPromoConfig(toSquare) {
  const column = toSquare[0]
  const offSetMap = {
    'a' : 0,
    'b' : 12.5,
    'c' : 24.5,
    'd' : 37,
    'e' : 49.25,
    'f' : 61.75,
    'g' : 74.25,
    'h' : 86.5,
  }
  const leftOffset = offSetMap[column]

  let color = 'black'
  let queenTop = 86.5
  let topOffsetIncrement = -12.5
  
  if (toSquare.includes('8')) { 
    color = 'white'
    queenTop = 0
    topOffsetIncrement = 12.5
  }

  const knightTop = queenTop + topOffsetIncrement
  const roookTop = knightTop + topOffsetIncrement
  const bishopTop = roookTop + topOffsetIncrement

  const config = { color, queenTop, roookTop, knightTop, bishopTop, leftOffset }
  return config
}


function getTurn(game) {
  return (game.turn() === 'w') ? 'white' : 'black';
}

function isPromotion(fromSquare, toSquare, game) {
  const squareState = game.get(fromSquare)
  if (squareState.type !== 'p') return false
  if (toSquare.includes('8') || toSquare.includes('1')) return true
  return false
}

