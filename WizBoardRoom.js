import {html, css} from './pageTools.js'
import games from './games.js'


const template = html`
  <div class="board-room">
    <div class="board-and-nav-2"> 
      <wiz-board-2 :nav-is-on="false" id="xyxzzy" :moves="moves" color-side="white">
      </wiz-board-2>
      <div class="board-nav">
      </div>
    </div>
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