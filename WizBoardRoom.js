import { html } from './pageTools.js'

const template = html`
  <div class="board-room">
    <div class="board-and-nav-2"> 
      
      <div class="top-panel"> 
        <img class="face" :src="'images/faces/' + cmp.face" :alt="cmp.name">
        <span class="wiz-kid-name">
          <h2>{{game.opponent}}</h2>
        </span>
        <!-- <wiz-badges-2></wiz-badges-2> -->
      </div>
      
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
        @go-index="goIndex"
        :game="game"
        :navIndex="navIndex"
        userName="thinktt">
      </wiz-board-nav>
    </div>
  </div>
`


export default {
  props: ['game', 'cmp'],
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
    },
    goIndex(index) {
      this.navIndex = index + 1
    }
  },
  template,
}