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
      <h3 v-if="(view === 'top' || badgeSelection)">Wiz Rating {{cmp.rating}}</h3>
      <!-- <h3 v-if="(view === 'top' || badgeSelection) && currentGameId" style="color:geen">Playing Now</h3> -->

      <wiz-badges-2 v-if="view === 'top' || badgeSelection" 
        :score="score" :isNemesis="isNemesis" :topFeat="topFeat" 
        :cmpName="cmp.name" :selection="badgeSelection" @selection-made="doBadgeSelection">
        <!-- <div v-if="!badgeSelection">
          <p>select a badge to learn its meaning</p>
        </div> -->
      </wiz-badges-2>
      <div v-if="view === 'top'" class="buttons">
        <a v-if="user && currentGameId && currentOpponent === cmp.name" 
          class="button blue" 
          :class="{'phone-nav': currentGameId == boardGameId && mainView === 'board'}"
          @click="$emit('goToCurrentGame')">
            Go to Game
        </a>
        <a v-if="user && currentGameId && currentOpponent !== cmp.name" 
          class="button blue" 
          @click="$emit('goToCurrentGame')">
            Finish {{currentOpponent}} Game
        </a>   
        <a v-if="user && !currentGameId" class="button blue" @click="startGame(cmp.name)">Play</a>
        <a v-else-if="!user" :href="signInLink" class="button blue">Sign in to Play</a>
        <a class="button yellow" @click="show('bio')">Bio</a>
        <a class="button yellow" @click="show('about')">Chess Style</a>
        <a v-if="user" class="button yellow phone-nav" @click="showGames()">See Games</a>
        <a @click="goBack" class="button yellow">Back</a>
      </div>

      <div v-if="view === 'pawn'">
        <p>The Pawn Badge means you have beaten {{cmp.name}} at least once.</p>
        <a class="button yellow" @click="show('top')">Back</a>
      </div>

      <div v-if="view === 'score'">
        <p>
          This is your Wiz Score. Your score goes up when you beat an opponent and down 
          when you lose to them. The Wiz Score never goes below -5 or higher than +5.
        </p>
        <a class="button yellow" @click="show('top')">Back</a>
      </div>

      <div v-if="view === 'trophy'">
        <p>
          Trophy Points are awarded when you conquer an opponent by getting a Wiz
          Score of +2 or higher. Get a trophy point for every opponent in a group to
          earn a Group Trophy. 
        </p>
        <a class="button yellow" @click="show('top')">Back</a>
      </div>

      <div v-if="view === 'nemesis'">
        <p>
          {{cmp.name}} is your Nemesis. You have played this player many times, won some, but 
          have not been able to conquor them. 
        </p>
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
    'currentGameId',
    'boardGameId',
    'mainView',
    'currentOpponent',
  ],
  computed: {
    shouldShowGoto() {
      if (this.user && this.curentGameId) {
        return true
      }
      return false
    }
  },
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
      console.log('show games')
      this.$emit('showGames')
    },
    doBadgeSelection(badgeToSelect) {
      this.badgeSelection = badgeToSelect
      this.view = badgeToSelect
    }
  },
  template,
}

