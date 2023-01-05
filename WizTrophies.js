import { html } from './pageTools.js'


const template = html`
  <div class="trophies"> 
    <h1>Your Trophies</h1>
    <div class="trophy-collection">
      <!-- <div v-for="group in groups" class="trophy-piece"> 
        <img :src="getGroupImg(group)" title="group trophy" :alt="group.trophy"> 
      </div> -->
      <wiz-trophy v-for="group in groups" key="group.title" :group="group" :games="games">
      </wiz-trophy>
    </div>
    <a class="button yellow" @click="$emit('goBack')">Back</a>
  </div>
`


export default {
  props: ['groups', "games"],
  methods: {
    getGroupImg(group) {
      return `images/${group.trophy}.png`
    }
  },
  template,
}