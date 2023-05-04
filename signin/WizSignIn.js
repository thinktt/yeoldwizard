import { html } from '../pageTools.js'
import lichessApi  from '../lichessApi.js'


const signInLink = await lichessApi.getSignInLink()

const template = html`
  <a class="button yellow" :href="signInLink">Sign In with Lichess</a>
  <!-- <a class="button blue" href="https://lichess.org/signup">Create A Lichesss Account</a> -->
  <a class="button blue" @click="$emit('upload')">Upload The King Chess Engine</a>
  <a class="button blue" @click="$emit('goToDisclaimer')">View Disclaimer</a>
`
export default {
  data() {
    return {  signInLink }
  },
  emits: ['goToDisclaimer', 'upload'],
  name: 'WizSignIn',
  template,
}

