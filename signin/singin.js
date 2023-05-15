import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import WizDisclaimer from './WizDisclaimer.js'
import { html } from '../pageTools.js'
import lichessApi  from '../lichessApi.js'


const signInLink = await lichessApi.getSignInLink()


const template = html`
  <wiz-disclaimer v-if="view === 'disclaimer'" @accept="accept">
  </wiz-disclaimer>
  <main class="down front-wall" v-else>
    <h1 class="down-title">Ye Old Wizard</h1>
    <img class="face" src="../images/faces/Dude.png" alt="Wizard">
    <div v-if="!user">
      <h2> 
        Welcome to the Ye Old Wizard. <br>
        Here you can play the Chessmaster bots on your phone or the web. <br>
        Sign in with Lichess to get started.
      </h2>
      <a class="button yellow" :href="signInLink">
        Sign In with Lichess
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
        Upload the King Chess Engine from the Chessmaster 9000, 10th Edition, or 11th 
        Edition.
        On your CD, DVD, or install directory look for the file "TheKing.exe" or "TheKing350.exe".
      </h2>
      <a class="button blue" @click="upload">
        Upload The King Chess Engine
      </a>
    </div>
  </main>
`

const kingHashes = [
  '511de09ec25fd8de0a41640c8e53ced4ebab1daeac01a8a9a3116a04f4ed7585',
  'bc4d67847a6c34ce6792e4b0e52e53abba46e71438e1c4e7b22c91122b48e554',
  '9bd6c1b16251e3a462c61c63b4811605a6072fbeb2311ebe7c05842dd0bfc236',
]

const app = createApp({
  data() {
    return {
      view: 'signIn',
      user: localStorage.user,
      engineIsVerified: localStorage.engineIsVerified === 'true',
      disclaimerIsAccepted: localStorage.disclaimerIsAccepted === 'true',
      signInLink,
   }
  },  
  beforeMount() {
    // there's no reason to be here go to the main app
    if (this.user && this.engineIsVerified && this.disclaimerIsAccepted) {
      window.location = localStorage.rootPath
      console.log('we can leave')
      return
    }
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
    upload() {
      const fileInput = document.createElement('input')
      fileInput.type = 'file'
      
      fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0]
        if (file.size > 208896) {
          console.log('file too big')
          // this.$emit('notVerfied')
          return
        }
        const hashBuffer = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        // console.log(hashHex)
        if (!kingHashes.includes(hashHex)) {
          console.log('incorrect king hash')
          this.failedToVerify()
          return
        }
        localStorage.engineIsVerified = true
        window.location = localStorage.rootPath
      })
      fileInput.click()
    },
    failedToVerify() {
      this.preMessage = `I didn't recongize that version of the King Chess Engine.`
    }
  },
  template
})
app.component('WizDisclaimer', WizDisclaimer)
const singIn = app.mount('#app')



let devHost = localStorage.devHost || 'localhost:8080'
let tokens

// a way to get dev to work using the same lichess client id
if (localStorage.redirectToDev === 'true' && window.location.search && 
    window.location.host !== devHost) {
      console.log('Forwarding to dev')
      const query = window.location.search 
      window.location = `http://${devHost}/signin` + query
}


async function doAccountFlow() {
  // first check if this is a Athorization callback
  const authCodeRegex = /code\=([_a-zA-Z0-9]*)/
  const match = authCodeRegex.exec(window.location.search.substr(1))
  if (match) {
    // go ahead and clear the query string as we no longer need it
    window.history.replaceState({}, null, window.location.origin + window.location.pathname)

    console.log("Auth callback detected, attempting to fetch tokens")
    const code = match[1]
    try {
      const token = await lichessApi.getToken(code)
      lichessApi.storeToken(token)
      const account = await lichessApi.getAccount()
      console.log('Setting user ' + account.username + ' in local storage')
      localStorage.user = account.username

    } catch (err) {
      console.log(err)
      app.signInFailed = true
      app.setError("There was an error signing into Lichess")
      window.err = err
    }
    return     
  }
}