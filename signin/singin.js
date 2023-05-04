import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import WizDisclaimer from './WizDisclaimer.js'
import WizSignIn from './WizSignIn.js'
import { html } from '../pageTools.js'


const template = html`
  <wiz-disclaimer v-if="view === 'disclaimer'" @accept="accept">
  </wiz-disclaimer>
  <main class="down" v-else>
    <h1 class="down-title">Ye Old Wizard</h1>
    <img class="face" src="../images/faces/Dude.png" alt="Wizard">
    <h2> Ye old Wizard uses Lichess to store games and play chess against the the Wiz personalities. 
    </h2>
    <wiz-sign-in @go-to-disclaimer="goToDisclaimer" @upload="upload">
    </wiz-sign-in>
  </main>

`

const app = createApp({
  data() {
    return {
      view: 'signIn',
      engineFile: null,
    }
  },
  methods: {
    accept() {
      this.view = 'signIn'
    },
    goToDisclaimer() {
      this.view = 'disclaimer'
    },
    upload() {
      const fileInput = document.createElement('input')
      fileInput.type = 'file'
      let file
      fileInput.addEventListener('change', async () => {
        file = fileInput.files[0]
        // console.log(file)
        // window.file = file
        // console.log(await file.text())
        const hashBuffer = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
        console.log(hashHex)
      })
      fileInput.click()

    }
  },
  template
})
app.component('WizDisclaimer', WizDisclaimer)
app.component('WizSignIn', WizSignIn)
const singIn = app.mount('#app')

// hash and array buffer with javascript crypto library
