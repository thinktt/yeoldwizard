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
  created() {
    document.onkeydown = this.keyNav
  },
  computed: {
    boardMoves() {
      return this.game.moves.slice(0, this.navIndex)
    }
  },
  methods: {
    goStart() {
      this.navIndex = 0
      const el = document.querySelector('.pgn-viewer')
      el.scrollTo({top: 0})
      el.scrollTo({left: 0})
    },
    goBack() {
      if (this.navIndex === 0) return 
      this.navIndex -- 
      const el = document.querySelector('#move' + this.navIndex)
      el.scrollIntoView({block: "center"})
    },
    goForward() {
      if (this.navIndex === this.game.moves.length) return 
      this.navIndex ++
      const el = document.querySelector('#move' + this.navIndex)
      el.scrollIntoView({block: "center"})
    },
    goEnd() {
      this.navIndex = this.game.moves.length
      const el = document.querySelector('#move' + this.navIndex)
      el.scrollIntoView({block: "center"})
    },
    goIndex(index) {
      this.navIndex = index + 1
    },
    keyNav(e) {
      if (e.keyCode === 39) this.goForward()
      if (e.keyCode === 37) this.goBack()
      if (e.keyCode === 38) this.goStart()
      if (e.keyCode === 40) this.goEnd()
    }
  },
  template,
}