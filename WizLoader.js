import { html } from './pageTools.js'
import games from './games.js'

const template = html`
  <div class="loader loading-message">
    <div class="icon knight spin">♞</div>
    
    <template v-if="shouldShowBar">
      <h2> Updating Local Game Database </h2>
      <div class="loader-bar">
        <div class="inner-bar" :style="{width: percent + '%'}"></div>
      </div>
      <!-- <h2> {{loadState.found}} Games found in local storage </h2> -->
      <!-- <h2>{{loadState.total}} Games found in lichess</h2> -->
      <h2>{{loadState.loaded}} Games Loaded</h2>
      <!-- <h2>{{loadState.nullGameCount}} previous nullgames recorded</h2> -->
      <!-- <h2> This may take some time... </h2> -->
      <!-- <h2>{{percent}}</h2> -->
    </template>
  </div>
`

export default {
  props: ['loadState'],
  data() {
    return {
      shouldShowBar: false,
    }
  },
  async mounted() {
    await new Promise(r => setTimeout(r, 1000))
    this.shouldShowBar = true
  },
  computed: {
    percent() {
      if (this.loadState.isDone) return 100
      const percent = Math.round(this.loadState.loaded / this.loadState.toGet * 100)
      if (!percent) return 0
      return percent
    }
  },
  template,
}