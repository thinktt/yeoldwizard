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
        @move="(move) => $emit('move', move)"  
        id="main-board"
        :moves="boardMoves" 
        :color-side="game.playedAs"
        :is-locked="isLocked">
      </wiz-board-2>
      
      <wiz-board-nav
        @quit-action="(action) => $emit('quitAction', action)"
        @go-start="goStart"
        @go-back="goBack"
        @go-forward="goForward"
        @go-end="goEnd"
        @go-index="goIndex"
        @route-back="$emit('route-back')"
        :draw-offer-state=drawOfferState
        :game="game"
        :navIndex="navIndex"
        :userName="user">
      </wiz-board-nav>
    </div>
  </div>
`


export default {
  props: ['game', 'cmp', 'user', 'drawOfferState'],
  data() {
    return {
      navIndex: 0,
    }
  },
  created() {
    document.onkeydown = this.keyNav
  },
  updated() {
    if(this.navIndex <= 0) {
      const el = document.querySelector('.pgn-viewer')
      el.scrollTo({top: 0})
      el.scrollTo({left: 0})
      return
    }
    const el = document.querySelector('#move' + this.navIndex)
    if (!el) return
    el.scrollIntoView({block: "center"})
  },
  computed: {
    boardMoves() {
      return this.game.moves.slice(0, this.navIndex)
    },
    isLocked() {
      const gameIsDone = this.game.status !== 'started'
      const navIsOnPreviousMoves = this.navIndex !== this.game.moves.length
      return gameIsDone || navIsOnPreviousMoves
    }
  },
  watch : {
    game: {
      handler(game) {
        this.navIndex = game.moves.length
        const query = '#move' + (this.navIndex)
        const el = document.querySelector(query)
      },
      deep: true, 
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
    },
    keyNav(e) {
      if (e.keyCode === 39) this.goForward()
      if (e.keyCode === 37) this.goBack()
      if (e.keyCode === 38) this.goStart()
      if (e.keyCode === 40) this.goEnd()
    },
  },
  template,
}