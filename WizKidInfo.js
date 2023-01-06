import { html } from './pageTools.js'


const template =  html`
  <div>
    <div>
      <img class="face" :src="'images/faces/' + cmp.face" alt="cmp.name">
      <h2>{{cmp.name}}</h2>
    </div>

    <div v-if="mode === 'preview'">
      <h3>{{cmp.rating}}</h3>
      <p>{{cmp.summary}} </p>
      <p>{{cmp.bio}}</p>
    </div>

    <div v-if="mode === 'minimal'">
      <h3>{{cmp.rating}}</h3>
      <p>{{cmp.summary}} </p>
    </div>

    <div v-else-if="mode === 'message'">
      <h3>{{cmp.rating}}</h3>
    </div>
    
    <template v-else-if="mode === 'control'">
      <h3 v-if="view === 'top'">Wiz Rating {{cmp.rating}}</h3>
      <div v-if="view === 'top'" class="buttons">
        <a v-if="user" class="button blue" @click="startGame(cmp.name)">Play</a>
        <a v-else :href="signInLink" class="button blue">Sign in to Play</a>
        <a class="button yellow" @click="show('bio')">Bio</a>
        <a class="button yellow" @click="show('about')">Chess Style</a>
        <a v-if="user" class="button yellow phone-nav" @click="showGames()">See Games</a>
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
    'mode',
    'user',
    'signInLink',
    // 'selectedName',
    // 'selectionIsLocked',
    // 'score',
    // 'isNemesis',
    // 'scoreMode',
    // 'topFeat',
  ],
  methods: {
    startGame(cmpName) {
      console.log('Start game with ' + cmpName)
      this.$emit('startGame')
    },
    show(view) {
      this.view = view
    },
    goBack() {
      this.$emit('deselect')  
    },
    showGames() {
      this.$emit('showGames')
    }
  },
  template,
}

