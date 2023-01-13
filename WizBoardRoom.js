import { html } from './pageTools.js'

const template = html`
  <div class="board-room">
    <div class="board-and-nav-2"> 
      <wiz-board-2  
        id="main-board"
        :moves="boardMoves" 
        :color-side="game.playedAs">
      </wiz-board-2>
      <wiz-board-nav
        @go-start="goStart"
        @go-back="goBack"
        @go-forward="goForward"
        @go-end="goEnd"
        :moves="game.moves" 
        :navIndex="navIndex">
      </wiz-board-nav>
    </div>
  </div>
`


export default {
  props: ['game'],
  data() {
    return {
      navIndex: 0,
    }
  },
  computed: {
    boardMoves() {
      return this.game.moves.slice(0, this.navIndex)
    }
  },
  methods: {
    goStart() {
      this.navIndex = 0
    },
    goBack() {
      if (this.navIndex === 0) return 
      this.navIndex -- 
    },
    goForward() {
      if (this.navIndex === this.game.moves.length) return 
      this.navIndex ++
    },
    goEnd() {
      this.navIndex = this.game.moves.length
    }
  },
  template,
}