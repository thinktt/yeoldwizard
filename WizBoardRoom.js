import {html, css} from './pageTools.js'
import games from './games.js'


const template = html`
  <div class="right-panel">
    <wiz-board :nav-is-on="true" id="xyxzzy" :moves="moves" :color-side="w">
    </wiz-board>
  </div>
`


export default {
  props: ['cmpName', 'gameId', 'color'],
  data() {
    return {
      games: null,
      moves: [],
    }
  },
  async created() {
  },
  computed: {
  },
  methods: {
  },
  template,
}