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
    <!-- <div>
      <span v-if="wonCount">{{wonCount}} won</span>
      <span v-if="drawCount">{{drawCount}} drawn</span>
      <span v-if="lostCount">{{lostCount}} lost</span>
    </div>  -->
    <p v-if="filteredIds.length">{{filteredIds.length}} games</p>
    <div class="game-list">
      <template v-for="game in games" :key="game.id">
        <div class="board-and-nav-box" :class="{ noshow: filteredIds.includes(game.id) === false }"> 
          <a :href="game.link + '/' + game.playedAs" target="_blank" rel="noopener noreferrer">
            <wiz-board :nav-is-on="false" :id="game.id" :moves="game.moves" :color-side="game.playedAs">
            </wiz-board> 
          </a>
          <div class="game-info-box">
            <div v-if="game.conclusion ==='draw'">
              <img class="king" src="images/king-draw.png">
            </div>
            <div v-if="game.conclusion === 'won'">
              <img class="king" src="images/king-won.png">
            </div>
            <div v-if="game.conclusion === 'lost'">
              <img class="king" src="images/king-lost.png">
            </div>
            <p>You played as {{game.playedAs}}</p>
            <p v-if="game.status === 'resign'">
                You
                <span>{{game.conclusion}}</span> 
                by resignation
            </p>
            <p v-else-if="game.status === 'draw'">
                Game was a draw
            </p>
            <p v-else>
              You
              <span> {{game.conclusion}}</span> 
              by {{game.status}}
            </p>
            <a :href="game.link + '/' + game.playedAs" target="_blank" rel="noopener noreferrer">View on Lichess</a>
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
    await new Promise(r => setTimeout(r, 1000))
    this.games = await games.getGamesWithMoves(this.cmpName)
    for (const game of this.games) {
      this.filteredIds.push(game.id)
    }
  },
  computed: {
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
  },
  template,
}