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
    
    <div v-if="dialog === 'start'">
      <h2 v-if="signInFailed" class="error">
        Failed to connect to Lichess. <br> Please try again. <br>
        If the problem continues conatact your Wiz Admin.
      </h2>
      <h2 v-else> 
        Welcome to Ye Old Wizard. <br>
        Here you can play the Chessmaster bots on your phone or the web. 
        Register a new account to get started or
        Sign in with Lichess if you already have an account.
      </h2>
      <a class="button yellow" @click="startRegistration">
        Register a New Account
      </a> <br>
      <a class="button blue" :href="signInLink">
        Sign In to Existing Account
      </a> <br>
      <!-- <a class="button blue" @click="goToDisclaimer">
        View Disclaimer
      </a> <br> -->
      <!-- <a class="button blue" @click="goToDisclaimer">
        Install the phone app
      </a> <br>  -->
      <a class="button blue" @click="allowBotBrowsing">
        Browse the Bots
      </a> 
    </div>

    <div v-else-if="dialog === 'noSlots'">
      <h2>
        Thanks for your interest in Ye Old Wizard. We are curretnly at capacity 
        for users. We will open up more slots soon. At that time you will need 
        The King Chess Engine, and a Lichess account to register. For now feel free
        to browse the bots. 
      </h2>
      
      <a class="button yellow" @click="allowBotBrowsing">
        Browse the Bots
      </a> <br>
      <a class="button blue" :href="signInLink">
        Sign In to Existing Account
      </a> <br>
    </div>


    <div v-else-if="dialog === 'openSlots'">
      <h2>
        Registration is open! There are {{slots}} slots left. To register
        you  will need, the King Chess Engine, and a Lichess account. 
        Accept the disclaimer to get started. 
      </h2>
      
      <a class="button blue" @click="goToDisclaimer">
        Accept the Disclaimer
      </a>
    </div>

          
    <div v-else-if="dialog === 'engine'">
      <h2>
        Next upload the King Chess Engine from the Chessmaster 9000, 10th Edition, or 11th Edition.
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

    <div v-else-if="dialog === 'lichess'">
      <h2>
         Let's connect to lichess to fisnish your registration. 
         Ye old Wizard uses Lichess accounts to track your games and intigrate 
         with lichess tools.
      </h2>
      
      <!-- <a class="button blue" :href="signInLink"> -->
      <a class="button blue" @click="dialog = 'done'">
        Sign In to existing account
      </a> <br>
      <a class="button yellow"  @click="registerWithLichess">
        Register new lichess account
      </a> <br>
    </div>

    <div v-else-if="dialog === 'redirecting'">
      <h2>
        Dicrecting you to lichess registration.<br> 
        Return to Ye Old Wizard when you have registered
      </h2>
      <div class="icon knight spin">♞</div>
    </div>

    
    <div v-else-if="dialog === 'done'">
      <h2>
        Congradulations you are now registered with Ye Old Wizard! 
        On the next screen you will see all the bots you can play. 
        Select the bot you want to play and then select "Play" 
      </h2>
      <a class="button blue" :href="rootPath">
        Continue
      </a>
    </div>

    <div v-else-if="dialog === 'install'">
      <h2>
        Ye Old Wizard is a Progressive Web App. This means you can install it
        as a phone app directly from the web. For best experience on a phone
        install the app. 
      </h2>
      <a class="button yellow" :href="rootPath">
        Install App on Phone
      </a> <br> 
      <a class="button blue" :href="rootPath">
        Skip Installation
      </a> <br>
    </div>

  </main>
`

const app = createApp({
  data() {
    return {
      slots: 0,
      view: 'signIn',
      dialog: 'start',
      user: localStorage.user,
      engineIsVerified: localStorage.engineIsVerified === 'true',
      disclaimerIsAccepted: localStorage.disclaimerIsAccepted === 'true',
      signInLink,
      signInFailed: localStorage.signInFailed === 'true',
      verificationFailed: false,
      rootPath: window.location.origin,
      isHidden: true,
      mw: localStorage.mw
   }
  },  
  beforeMount() {
    // there's no reason to be here go to the main app
    if (this.user && this.engineIsVerified && this.disclaimerIsAccepted) {
      localStorage.signInFailed = false
      window.location = window.location.origin
      return
    }
    this.tryMagicWord()
    // clear any local storage error
    localStorage.signInFailed = false
    this.isHidden = false
  },
  methods: {
    startRegistration() {
      if (this.slots <= 0) {
        this.dialog = 'noSlots'
        return
      }

      if (true) {}

      
      this.dialog = 'openSlots'
    },
    async registerWithLichess() {
      this.dialog = 'redirecting'
      await new Promise(r => setTimeout(r, 1000))
      window.open('https://lichess.org/signup', '_blank')
      this.dialog = 'lichess'
    },
    accept() {
      this.view = 'signIn'
      this.disclaimerIsAccepted = true
      this.dialog = 'engine'
      localStorage.disclaimerIsAccepted = true
      this.tryMagicWord()
    },
    async tryMagicWord() {
      const id = localStorage.user

      if (!id) {
        console.log('no user no magic')
        return 
      }

      const user = { id, kingBlob: `howdy ${this.mw}`, hasAcceptedDisclaimer: true }
      let err = null
      const res = await yowApi.addUser(user).catch(e => err = e)
      if (err) {
        console.log('no magic here', err.message)
        return
      }
      localStorage.engineIsVerified = true
      this.engineIsVerified = true
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

        // do a frotnend check before uploading
        const kingBlob = await king.fileToB64(file)
        const kingHasValidHash = await king.getVersion(kingBlob)
        if (!kingHasValidHash) {
          console.log('precheck of king failed')
          this.verificationFailed = true
          return
        }

        this.dialog = 'lichess'
        return 

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