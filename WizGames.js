import { nextTick } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import {html, css} from './pageTools.js'
import games from './games.js'

const template = html`
  <div v-if="games" class="games">
    <a class="button yellow phone-nav" @click="goBack">Back</a>
    <h1>Games with {{cmpName}}</h1>
    <div class="game-filter">
      <span class="selector-box">
        <img @click="select('won')" :class="{selected: wonIsSelected}"  class="king" src="images/king-won.png">
        <!-- <span v-if="wonCount">{{wonCount}} won</span> -->
      </span>
      <span class="selector-box"> 
        <img  @click="select('draw')" :class="{selected: drawIsSelected}" class="king" src="images/king-draw.png">
        <!-- <span v-if="drawCount">{{drawCount}} drawn</span> -->
      </span>
      <span class="selector-box"> 
        <img @click="select('lost')" :class="{selected: lostIsSelected}" class="king" src="images/king-lost.png">
        <!-- <span v-if="lostCount">{{lostCount}} lost</span> -->
      </span>
    </div>
    <p v-if="filteredIds.length">{{filteredIds.length}} games</p>
    <div class="game-list">
      
    <template v-for="game in eagerGames" :key="game.id">
        <div class="board-and-nav-box" :class="{ noshow: filteredIds.includes(game.id) === false }"> 
            <a @click="$emit('showGame', game)">
            <wiz-board 
              :end-fen="game.endFen"
              :nav-is-on="false" 
              :id="game.id" :moves="game.moves" 
              :color-side="game.playedAs">
            </wiz-board> 
          </a>
          <div class="game-info-box">
            <wiz-game-status :game="game" :shouldShowPlayedAs="true">
            </wiz-game-status>
            
            <button title="view on Lichess" class="lichess-button" @click="openGame(game)">
              &#xe901;
            </button>
            <div class="lichess-message">view on lichess</div>
          </div>
        </div>
      </template>

      <template v-for="game in lazyGames" :key="game.id">
        <div class="board-and-nav-box" :class="{ noshow: filteredIds.includes(game.id) === false }"> 
            <a @click="$emit('showGame', game)">
            <wiz-board 
              :end-fen="game.endFen"
              :nav-is-on="false" 
              :id="game.id" :moves="game.moves" 
              :color-side="game.playedAs">
            </wiz-board> 
          </a>
          <div class="game-info-box">
            <wiz-game-status :game="game" :shouldShowPlayedAs="true">
            </wiz-game-status>
            
            <button title="view on Lichess" class="lichess-button" @click="openGame(game)">
              &#xe901;
            </button>
            <div class="lichess-message">view on lichess</div>
          </div>
        </div>
      </template>

    </div>
    <p v-if="games.length === 0" class="filter-message"> 
      It looks like you haven't played any games with {{cmpName}}. Start a game and when you finish it will appear here. 
    </p>
    <p v-else-if="filteredIds.length === 0" class="filter-message">No games found for selected filters. Click the filter icons above.</p>
  </div>
  <div v-else class="games loading-message">
    <h2> Loading your games with {{cmpName}}...</h2>
    <div class="icon knight spin">♞</div>
  </div>
`


export default {
  props: ['cmpName'],
  data() {
    return {
      games: null,
      moves: [],
      shouldShowLazyGames: false,
      wonIsSelected: true, 
      drawIsSelected: true,
      lostIsSelected: true,
      wonCount: 0,
      drawCount: 0,
      lostCount: 0,
      filteredIds: [],
    }
  },
  async created() {
    this.games = await games.getGames(this.cmpName)
    for (const game of this.games) {
      this.filteredIds.push(game.id)
    }
    // seems ugly but can't find a better way for lazy games to render
    // after page is visible, nexTick doesn't seem to work
    await new Promise(r => setTimeout(r, 500))
    this.shouldShowLazyGames = true
  },
  computed: {
    eagerGames() {
      return this.games.slice(0,3)
    },
    lazyGames() {
      if (this.shouldShowLazyGames) return this.games.slice(3)
      return []
    },
    filteredGamesOld() {
      const selectedFilters = []
      if (this.wonIsSelected) selectedFilters.push('won')
      if (this.drawIsSelected) selectedFilters.push('draw')
      if (this.lostIsSelected) selectedFilters.push('lost')
      const filteredGames = this.games.filter(game => selectedFilters.includes(game.conclusion))
      return filteredGames
    }
  },
  methods: {
    doFilter() {
      const selectedFilters = []
      if (this.wonIsSelected) selectedFilters.push('won')
      if (this.drawIsSelected) selectedFilters.push('draw')
      if (this.lostIsSelected) selectedFilters.push('lost')
      const filteredIds = []
      this.wonCount = 0
      this.lostCount = 0
      this.drawCount = 0
      for (const game of this.games) {
        if (selectedFilters.includes(game.conclusion)) {
          filteredIds.push(game.id) 
          this[game.conclusion + 'Count'] ++
        }
      }
      this.filteredIds = filteredIds
    },
    select(selection) {
      const filterToToggle = selection + 'IsSelected'
      this[filterToToggle] = !this[filterToToggle] 
      this.doFilter()
    },
    goBack() {
      this.$emit('goBack')
    },
    openGame(game) {
      const url = 'https://lichess.org/' + game.id + '/' + game.playedAs
      console.log(url)
      window.open(url, '_blank')
    },
  },
  template,
}