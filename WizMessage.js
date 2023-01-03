import { html } from './pageTools.js'


const template =  html`
  <div>
    <span v-if="type === 'error'" class="error-message" >
      <div  class="icon knight dead">♞</div>
      <h3>Error</h3>
      <p>{{message}}</p>
      <p>Please contact your Wizard Admin</p>
      <a class="button yellow" @click="$emit('clearError')">Ok</a>
    </span>

    <span v-if="type === 'connecting'" class="start-message" >
      <div>Connecting to Lichess...</div>
      <div  class="icon knight spin">♞</div>
    </span>

    <span v-if="type === 'starting'" class="start-message" >
      <div>Starting game...</div>
      <div  class="icon knight spin">♞</div>
    </span>

    <span v-if="type === 'started'" class="start-message" >
      <div>Your game has started!</div>
      <p>Click to GO TO GAME or open the Lichess app on your phone to play.</p>
      <a @click="$emit('openGame')" class="button blue">
        Go to Game
      </a>
    </span>

    <span v-if="type === 'ended'" class="start-message" >
      <h3>Game Finished</h3>
      <p>
        {{message}}!
        <!-- Click OK to find a new opponent -->
      </p>
      <a class="button yellow" @click="$emit('clearMessage')">OK</a>
    </span>
</div>
 `


export default {
  name: 'WizMessage',
  // data() {
  //   return {}
  // },
  props: [
    'type',
    'message',
  ],
  // methods: {
  // },
  template,
}

