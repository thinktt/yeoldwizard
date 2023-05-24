import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import WizDisclaimer from './WizDisclaimer.js'
import { html } from '../pageTools.js'
import yowApi from '../yowApi.js'
import lichessApi  from '../lichessApi.js'


const signInLink = await lichessApi.getSignInLink()


const template = html`
  <wiz-disclaimer v-if="view === 'disclaimer'" @accept="accept">
  </wiz-disclaimer>
  <main class="down front-wall" v-else>
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
      signInFailed: localStorage.signInFailed === 'true',
      verificationFailed: false,
      rootPath: window.location.origin,
   }
  },  
  beforeMount() {
    // there's no reason to be here go to the main app
    if (this.user && this.engineIsVerified && this.disclaimerIsAccepted) {
      window.location = localStorage.rootPath
      console.log('we can leave')
      return
    }
    // clear any local storage error
    localStorage.signInFailed = false
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

        const kingBlob = await fileToB64(file)
        console.log(kingBlob)
        const id = localStorage.user
        const user = { id, kingBlob, hasAcceptedDisclaimer: true }
        
        const res = await yowApi.addUser(user)
        if (res.status !== 200) {
          console.log('error uploading king', res.status, res.body.json())
          this.verificationFailed = true
        }

        return

        localStorage.engineIsVerified = true
        this.engineIsVerified = true
        // window.location = localStorage.rootPath
      })
      fileInput.click()
    },
  },
  template
})
app.component('WizDisclaimer', WizDisclaimer)
const singIn = app.mount('#app')

async function fileToB64(file) { 
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
  })
}

// function that conversts base64 to buffer
function b64ToBuffer(b64) {
  const byteString = atob(b64.split(',')[1])
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
  }
  return ab
}



// const hashBuffer = await crypto.subtle.digest('SHA-256', ab)
// const hashArray = Array.from(new Uint8Array(hashBuffer))
// const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
// console.log(hashHex)

// if (!kingHashes.includes(hashHex)) {
//   console.log('incorrect king hash')
//   this.verificationFailed = true
//   return
// }

// console.log('ver-fide')