import { html } from './pageTools.js'
import { computed } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'


const template = html`
  <div class="board-room">
    
    <div class="board-and-nav-2"> 
      
      <div class="top-panel"> 
        <img class="face" :src="'images/faces/' + cmp.face" :alt="cmp.name">
        <span class="wiz-kid-name">
          <h2>{{game.opponent}}</h2>
        </span>
      </div>
      
      <wiz-board-2
        @move="(move) => $emit('move', move)"  
        id="main-board"
        :fen="boardPosition"
        :color-side="game.playedAs"
        :is-locked="isLocked"
        :last-move="lastMove"
        :game-id="game.id">
      </wiz-board-2>
      
      <wiz-board-nav
        @quit-action="(action) => $emit('quitAction', action)"
        @go-start="goStart"
        @go-back="goBack"
        @go-forward="goForward"
        @go-end="goEnd"
        @go-index="goIndex"
        @route-back="$emit('route-back')"
        @stop-demo="turnOffDemo"
        @start-demo="turnOnDemo"
        :draw-offer-state=drawOfferState
        :game="game"
        :algebra-moves="algebraMoves"
        :navIndex="navIndex"
        :userName="game.demoPlayer || user"
        :demoIsRunning="demoIsRunning"
        :demoIsOn="demoIsOn">
      </wiz-board-nav>
    </div>
  </div>
`


export default {
  props: ['game', 'cmp', 'user', 'drawOfferState', 'opponentScore', 
    'opponentTopFeat', 'opponentWinCount', 'selectedGroup', ],
  data() {
    return {
      navIndex: 0,
      fensByMove: [],
      algebraMoves: [],
      boardState: null,
      lastMove: null,
      player: this.user,
      demoIsRunning : false,
      demoIsOn : !this.user,
    }
  },
  provide() {
    return {
      score: computed(() => this.opponentScore),
      topFeat: computed(() => this.opponentTopFeat),
      winCount: computed(() => this.opponentWinCount),
      game: computed(() => this.game),
      gameConclusion: computed(() => this.game.conclusion),
      groupTitle: computed(() => this.selectedGroup?.title),
      groupTrophy: computed(() => this.selectedGroup?.trophy),
      groupHasTrophy: computed(() => this.selectedGroup?.hasTrophy),
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

    if (isInPhoneMode()) {
      el.scrollIntoView({block: "nearest", inline: 'center'})
      return
    }
    el.scrollIntoView({block: "center"})
  },
  computed: {
    // lastMove() {
    //   return getLastMove(this.game, this.navIndex)
    // },
    boardPosition() {
      const startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      const i = this.navIndex - 1
      const fen = this.fensByMove[i] || startFen
      return fen
    },
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
    'game.moves'(newMoves, oldMoves) {
      // if this is a newley loaded game we let game.id watcher process the moves
      if (this.hasFreshMoves) {
        this.hasFreshMoves = false
        return 
      }
      if (newMoves.length > oldMoves.length) {
        const newMove = newMoves[newMoves.length - 1]
        this.boardState.move(newMove, { sloppy: true })
        this.fensByMove.push(this.boardState.fen())
        this.algebraMoves = this.boardState.history()
        this.navIndex = this.game.moves.length
      }
    },
    'game.id'() {
      this.hasFreshMoves = true
      this.fensByMove = []
      this.boardState = new Chess()
      for (const move of this.game.moves) {
        this.boardState.move(move, { sloppy: true }) 
        this.fensByMove.push(this.boardState.fen())
      }
      this.algebraMoves = this.boardState.history()
      if (!this.user) {
        this.runDemo()
        return
      }
      this.navIndex = this.game.moves.length
    },
    navIndex() {
      this.lastMove = getLastMove(this.boardState, this.navIndex)
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
    async runDemo() {
      if (this.demoIsRunning) return
      this.demoIsRunning = true

      const setGameAsStarted = () => {
        this.game.status = 'started'
        this.game.conclusion = null
        this.demoIsRunning = true
      }
      const setGameAsCompleted = () => {
        this.game.status = 'mate'
        this.game.conclusion = 'won'
        this.demoIsRunning = false
      }

      setGameAsStarted()
      await new Promise(resolve => setTimeout(resolve, 1000))

      while(this.demoIsOn) {
        if (this.navIndex < this.game.moves.length) {
          this.goForward()
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }
        setGameAsCompleted()
        await new Promise(resolve => setTimeout(resolve, 5000))
        this.goStart()
        setGameAsStarted()
      }

      setGameAsCompleted()
      this.goStart()
      // this.resolveDemoRun()
      this.demoIsRunning = false
    },
    turnOffDemo() {
      this.demoIsOn = false
    },
    turnOnDemo() {
      this.demoIsOn = true
      this.runDemo()
    }
  },
  template,
}

function isInPhoneMode () {
  return window.matchMedia('(max-width: 1080px)').matches
}

function getLastMove(game, moveIndex) {
  const moves = game.history({ verbose: true })
  const lastMove = moves[moveIndex - 1]
  if (!lastMove) return null

  const { from, to } = lastMove 
  return [ from, to ]
}