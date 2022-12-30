import { html } from './pageTools.js'


const template =  html`
  <div>
    <div>
      <img class="face" :src="'images/faces/' + cmp.face" alt="cmp.name">
      <h2>{{cmp.name}}</h2>
      
    </div>


    <div v-if="isInPreview">
      <h3>{{cmp.rating}}</h3>
      <p>{{cmp.summary}} </p>
      <p>{{cmp.bio}}</p>
    </div>
    
    <template v-else-if="user">
      <h3 v-if="view === 'top'">Wiz Rating {{cmp.rating}}</h3>
      <!-- v-if="infoMode === 'selected' && user" -->
      <div v-if="view === 'top'" class="buttons">
        <!-- <a class="button yellow" @click="stopSelectionLock">Back</a> -->
        <a class="button blue" @click="startGame(cmp.name)">Play</a>
        <a class="button yellow" @click="show('bio')">Bio</a>
        <a class="button yellow" @click="show('about')">Chess Style</a>
        <!-- <a class="button yellow">Your Stats</a> -->
        <a @click="goBack" class="button yellow">Back</a>
      </div>
      
      <div v-if="view === 'about'" class="about">
        <p>{{cmp.summary}} </p>
        <p>{{cmp.style}}</p> 
        <a class="button yellow" @click="show('top')">Back</a>
      </div>

      <div v-if="view === 'bio'" class="bio">
        <p>{{cmp.bio}}</p>
        <a class="button yellow" @click="show('top')">Back</a>
      </div>
    </template>
  </div>

  <!-- v-if="infoMode === 'browsing' || infoMode === 'selected'" -->
  <!-- v-if="infoMode === 'browsing'" -->
  
`


export default {
  name: 'WizKidInfo',
  data() {
    return {
      view: 'top',
    }
  },
  props: [
    'cmp',
    'isInPreview',
    'user',
    // 'selectedName',
    // 'selectionIsLocked',
    // 'score',
    // 'isNemesis',
    // 'scoreMode',
    // 'topFeat',
  ],
  methods: {
    stopSelectionLock() {
      console.log('stopLock')
    },
    startGame(cmpName) {
      console.log('Start game with ' + cmpName)
    },
    show(view) {
      this.view = view
    },
    goBack() {
      this.$emit('deselect')  
    },
  },
  template,
}

