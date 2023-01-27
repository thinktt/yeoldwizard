import { html } from './pageTools.js'
import games from './games.js'

const template = html`
  <div class="games loading-message">
    <h2> Updating your games database </h2>
    <h2>{{counts.loaded}} of {{counts.total}} games loaded</h2>
    <h2> This may take some time... </h2>
    <!-- <div class="icon knight spin">♞</div> -->
  </div>
`


export default {
  props: [],
  data() {
    return {
      totalCount: 744,
      loadedGames: [],
      counts : {loaded: 0, total: 0}
    }
  },
  mounted() {
    games.loadGames(this.loadedGames, this.counts)
  },
  template,
}