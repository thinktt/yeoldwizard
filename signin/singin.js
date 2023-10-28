import { createApp } from 'https://unpkg.com/vue@3.3.6/dist/vue.esm-browser.js'
import WizDisclaimer from './WizDisclaimer.js'
import { html } from '../pageTools.js'
import yowApi from '../yowApi.js'
import lichessApi  from '../lichessApi.js'
import king from './king.js'

const codeVerifier = getCodeVerifier()
const signInLink = await lichessApi.getSignInLink(codeVerifier)

const template = html`
  <wiz-disclaimer v-if="view === 'disclaimer'" @accept="accept">
  </wiz-disclaimer>
  <main class="down front-wall" :class="{hidden: isHidden}" v-else>
    <h1 class="down-title">Ye Old Wizard</h1>
    <img class="face" src="../images/faces/Dude.png" alt="Wizard">
    <div v-if="!user">
      <h2 v-if="signInFailed" class="error">
        Failed to connect to Lichess. <br> Please try again. <br>
        If the problem continues conatact your Wiz Admin.
      </h2>
      <h2 v-else> 
        Welcome to the Ye Old Wizard. <br>
        Here you can play the Chessmaster bots on your phone or the web. <br>
        Sign in with Lichess to get started.
      </h2>
      <a class="button yellow" :href="signInLink">
        Sign In with Lichess
      </a> <br>
      <a class="button blue" @click="allowBotBrowsing">
        Browse the Bots
      </a> <br>
      <a class="button blue" @click="goToDisclaimer">
        View Disclaimer
      </a>
    </div>
    <div  v-else-if="!disclaimerIsAccepted">
      <h2>
        Before we get started, please click below to read and agree to the disclaimer.
      </h2>
      <a class="button blue" @click="goToDisclaimer">
        View Disclaimer
      </a>
    </div>
    <div v-else-if="!engineIsVerified">
      <h2>
        Upload the King Chess Engine from the Chessmaster 9000, 10th Edition, or 11th Edition.
        On your CD, DVD, or install directory look for the file "TheKing.exe" or "TheKing350.exe".
      </h2>
      <a class="button blue" @click="upload">
        Upload The King Chess Engine
      </a>
      <h2 v-if="verificationFailed" class="error">
        Could not verify the King Chess Engine. Please try again.
      </h2>
      <br>
      <!-- <div class="icon knight spin">♞</div> -->
    </div>
    <div v-else>
      <h2>
        You are now reginstered to play games with Ye Old Wizard! 
        On the next screen you will see all the bots you can play. 
        Select the bot you want to play and then select "Play" 
      </h2>
      <a class="button blue" :href="rootPath">
        Continue
      </a>
    </div>
  </main>
`

const app = createApp({
  data() {
    return {
      view: 'signIn',
      user: localStorage.user,
      engineIsVerified: localStorage.engineIsVerified === 'true',
      disclaimerIsAccepted: localStorage.disclaimerIsAccepted === 'true',
      signInLink,
      signInFailed: localStorage.signInFailed === 'true',
      verificationFailed: false,
      rootPath: window.location.origin,
      isHidden: true,
   }
  },  
  beforeMount() {
    // there's no reason to be here go to the main app
    if (this.user && this.engineIsVerified && this.disclaimerIsAccepted) {
      localStorage.signInFailed = false
      window.location = window.location.origin
      return
    }

    // clear any local storage error
    localStorage.signInFailed = false
    this.isHidden = false
  },
  methods: {
    accept() {
      this.view = 'signIn'
      this.disclaimerIsAccepted = true
      localStorage.disclaimerIsAccepted = true
    },
    goToDisclaimer() {
      this.view = 'disclaimer'
    },
    async allowBotBrowsing() {
      window.location = window.location.origin + '?botBrowsing=true'
    },
    upload() {
      this.verificationFailed = false
      const fileInput = document.createElement('input')
      fileInput.type = 'file'
      
      fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0]
        if (file.size > 208896) {
          console.log('file too big')
          this.verificationFailed = true
          return
        }

        window.file = file

        // do a frotnend check before uploading
        const kingBlob = await king.fileToB64(file)
        const kingHasValidHash = await king.getVersion(kingBlob)
        if (!kingHasValidHash) {
          console.log('precheck of king failed')
          this.verificationFailed = true
          return
        }

        // upload user info and king blob for backend check and registration
        const id = localStorage.user
        const user = { id, kingBlob, hasAcceptedDisclaimer: true }
        let err = null
        const res = await yowApi.addUser(user).catch(e => err = e)
        if (err) {
          console.log('error uploading king', err.message)
          this.verificationFailed = true
          return
        }

        localStorage.engineIsVerified = true
        this.engineIsVerified = true
      })
      fileInput.click()
    },
  },
  template
})
app.component('WizDisclaimer', WizDisclaimer)
const singIn = app.mount('#app')

function getCodeVerifier() {
  const codeVerifier = localStorage.codeVerifier
  if (codeVerifier) {
    return codeVerifier
  }

  const PKCE_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const RECOMMENDED_CODE_VERIFIER_LENGTH = 96
  const output = new Uint32Array(RECOMMENDED_CODE_VERIFIER_LENGTH);
  crypto.getRandomValues(output);
  const randStr = base64urlEncode(Array
    .from(output)
    .map((num) => PKCE_CHARSET[num % PKCE_CHARSET.length])
    .join(''));
  
  localStorage.codeVerifier = randStr
  return randStr
}

function base64urlEncode(value) {
  let base64 = btoa(value);
  base64 = base64.replace(/\+/g, '-');
  base64 = base64.replace(/\//g, '_');
  base64 = base64.replace(/=/g, '');
  return base64;
}