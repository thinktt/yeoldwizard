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


    
    <template v-if="mode === 'control'">
      <h3 v-if="view === 'top' || badgeSelection">Wiz Rating {{cmp.rating}}</h3>
      <wiz-badges-2 v-if="view === 'top' || badgeSelection" 
        :score="score" :isNemesis="isNemesis" :topFeat="topFeat" 
        :cmpName="cmp.name" :selection="badgeSelection" @selection-made="doBadgeSelection">
      </wiz-badges-2>
      <div v-if="view === 'top'" class="buttons">
        <a v-if="user" class="button blue" @click="startGame(cmp.name)">Play</a>
        <a v-else :href="signInLink" class="button blue">Sign in to Play</a>
        <a class="button yellow" @click="show('bio')">Bio</a>
        <a class="button yellow" @click="show('about')">Chess Style</a>
        <a v-if="user" class="button yellow phone-nav" @click="showGames()">See Games</a>
        <a @click="goBack" class="button yellow">Back</a>
      </div>

      <div v-if="view === 'pawn'">
        <p>Talk about pawn badge</p>
        <a class="button yellow" @click="show('top')">Back</a>
      </div>

      <div v-if="view === 'score'">
        <p>Talk about score badge</p>
        <a class="button yellow" @click="show('top')">Back</a>
      </div>

      <div v-if="view === 'trophy'">
        <p>Talk about trophy badge</p>
        <a class="button yellow" @click="show('top')">Back</a>
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
`


export default {
  name: 'WizKidInfo',
  data() {
    return {
      view: 'top',
      badgeSelection: '',
    }
  },
  props: [
    'cmp',
    'mode',
    'user',
    'signInLink',
    'score',
    'isNemesis',
    'topFeat',
  ],
  methods: {
    startGame(cmpName) {
      console.log('Start game with ' + cmpName)
      this.$emit('startGame')
    },
    show(view) {
      this.view = view
      this.badgeSelection = null
    },
    goBack() {
      this.$emit('deselect')  
    },
    showGames() {
      this.$emit('showGames')
    },
    doBadgeSelection(badgeToSelect) {
      this.badgeSelection = badgeToSelect
      this.view = badgeToSelect
    }
  },
  template,
}

