import {html, css} from './pageTools.js'
import games from './games.js'


const template = html`
  <div v-if="games" class="games">
    <h1>Games with {{cmpName}}</h1>
    <div class="game-filter">
      <img @click="select('won')" :class="{selected: wonIsSelected}"  class="king" src="images/king-won.png">
      <img @click="select('draw')" :class="{selected: drawIsSelected}" class="king" src="images/king-draw.png">
      <img @click="select('lost')" :class="{selected: lostIsSelected}" class="king" src="images/king-lost.png">
      <span class="score">10</span>
    </div>

    <template v-if="games.length">
      <template v-for="game in games" :key="game.id">
        <div class="board-and-nav-box" :class="{ 'no-display': filteredIds.includes(game.id) === false }"> 
          <a :href="game.link" target="_blank" rel="noopener noreferrer">
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
            <a :href="game.link" target="_blank" rel="noopener noreferrer">View on Lichess</a>
          </div>
        </div>
    </template>
    </template>
    <template v-else> 
      <p class="filter-message">No games found for selected filters. Click the filter icons above.</p>
    </template>

  </div>
  <div v-else class="games loading-message">
    <h1> Loading your games with {{cmpName}}...</h1>
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
      for (const game of this.games) {
        if (selectedFilters.includes(game.conclusion)) {
          filteredIds.push(game.id) 
          console.log(game.id)
        }
      }
      this.filteredIds = filteredIds
    },
    select(selection) {
      console.log(selection)
      const filterToToggle = selection + 'IsSelected'
      this[filterToToggle] = !this[filterToToggle] 
      this.doFilter()
    }
  },
  template,
}