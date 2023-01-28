import { html } from './pageTools.js'
import games from './games.js'

const template = html`
  <div class="games loading-message">
    <h2> Updating Local Games Database </h2>
    <h2> {{loadState.found}} Games found in local storage </h2>
    <h2>{{loadState.loaded}} of {{loadState.toGet}} games loaded</h2>
    <h2> This may take some time... </h2>
    <!-- <div class="icon knight spin">♞</div> -->
  </div>
`


export default {
  props: [],
  data() {
    return {
      loadState : {loaded: 0, found: 0, toGet: 0, total: 0, isDone: false}
    }
  },
  mounted() {
    games.loadGames(this.loadState)
  },
  template,
}