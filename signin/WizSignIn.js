import { html } from '../pageTools.js'
import lichessApi  from '../lichessApi.js'


const signInLink = await lichessApi.getSignInLink()

const template = html`
  <a v-if="!user" class="button yellow" :href="signInLink">
    Sign In with Lichess
  </a>
  <a v-else-if="!disclaimerIsAccepted" class="button blue" @click="$emit('goToDisclaimer')">
    View Disclaimer
  </a>
  <a v-else-if="!engineIsVerified" class="button blue" @click="$emit('upload')">
    Upload The King Chess Engine
  </a>
  <!-- <a class="button blue" href="https://lichess.org/signup">Create A Lichesss Account</a> -->
`
export default {
  data() {
    return {  signInLink }
  },
  props: ['user', 'engineIsVerified', 'disclaimerIsAccepted'],
  emits: ['goToDisclaimer', 'upload'],
  name: 'WizSignIn',
  template,
}

