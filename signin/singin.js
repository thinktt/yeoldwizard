import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import WizDisclaimer from './WizDisclaimer.js'
import WizSignIn from './WizSignIn.js'
import { html } from '../pageTools.js'


const template = html`
  <wiz-disclaimer v-if="view === 'disclaimer'" @accept="accept">
  </wiz-disclaimer>
  <main class="down front-wall" v-else>
    <h1 class="down-title">Ye Old Wizard</h1>
    <img class="face" src="../images/faces/Dude.png" alt="Wizard">
    <h2 v-if="user === null"> 
      Welcome to Ye Old Wizard. I'm the Wizard. Here you can play me and my 180 Chess 
      personalities, all brought back to life from the Chessmaster game series. I uses Lichess to play 
      the personalities and track your scores against  each one. To get started sign in to Lichess.
    </h2>
    <h2 v-else-if="!disclaimerAccepted">
      Before we get started, please click below to read and agree to the disclaimer.
    </h2>
    <h2 v-else-if="!egnineFileVerfied">
      {{preMessage}} You can upload the engine from the Chessmaster 9000, 10th Edition, or 11th 
      Edition. On your CD, DVD, or install directory look for the file "TheKing.exe" or "TheKing350.exe".
    </h2>
    <wiz-sign-in 
      @go-to-disclaimer="goToDisclaimer" 
      @upload="upload"
      :user="user"
      :egnineFileVerfied="egnineFileVerfied"
      :disclaimerAccepted="disclaimerAccepted"
    >
    </wiz-sign-in>
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
      user: null,
      egnineFileVerfied: false,
      disclaimerAccepted: false,
      preMessage: `One more step! Click below to upload the King Chess Engine. 
        This is my brain and I use it to play the personalities.`
      // text: introText,
      // introText,
      // disclaimerRequest,
      // engineUploadRequest,
    }
  },
  // watch: {
  //   egnineFileVerfied(value) {
  //     if(value === true)  window.location = 'http://localhost:8081' 
  //   },
  // },
  mounted() {
    console.log('mounted')
    this.user = localStorage.getItem('user') 
    // this.egnineFileVerfied = JSON.parse(localStorage.egnineFileVerfied)
    // this.disclaimerAccepted = JSON.parse(localStorage.disclaimerAccepted)
  },
  methods: {
    accept() {
      this.view = 'signIn'
      this.disclaimerAccepted = true
      localStorage.setItem('disclaimerAccepted', true)
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
        // this.egnineFileVerfied = true
        localStorage.setItem('egnineFileVerfied', true)
        window.location = 'http://localhost:8081'
        // this.$emit('verfied')
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
app.component('WizSignIn', WizSignIn)
const singIn = app.mount('#app')
