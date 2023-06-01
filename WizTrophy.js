import { html } from './pageTools.js'


const template = html`
  <div v-if="hasTrophy" class="trophy-piece" :class="{'short-pawn': shortPawn && group.trophy == 'goldenpawn'}"> 
    <img :src="getGroupImg(group)" :title="'You conquered all ' + group.title" 
      :alt="group.trophy"> 
  </div>
`


export default {
  props: ['group', 'games', 'shortPawn'],
  methods: {
    getGroupImg(group) {
      let trophyName = group.trophy
      if (this.shortPawn && trophyName == 'goldenpawn') {
        trophyName += '-short'
      }
      return `images/${trophyName}.png`
    }
  },
  computed: {
    hasTrophy() {
      let hasTrophy = true
      for (const cmp of this.group.cmps) {
        // console.log(this.games[cmp.name])
        const cmpGames = this.games[cmp.name]

        // haven't even played this cmp so no trophy for you
        if (!cmpGames) {
          hasTrophy = false
          break
        } 

        // a score in this group is less than to so no trophy for you
        if (this.games[cmp.name].score && this.games[cmp.name].score < 2) {
          hasTrophy = false
          break
        }
      }
      
      // this is bad as it mutates top level state, but it it's a simple 
      // hack for now to let us know in other components the group has the trophy
      this.group.hasTrophy = hasTrophy

      return hasTrophy
    }
  },
  template,
}