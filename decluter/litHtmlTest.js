// import {LitElement, html, css} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/all/lit-all.min.js'
import {LitElement, html, css, render} from 'https://cdn.jsdelivr.net/gh/lit/dist@2/core/lit-core.min.js'



function getHeaderHtml( { user, signInFailed, shouldShowSignOut } ) {
  signInFailed = signInFailed || false
  let singInHtml =''

  if (signInFailed) {
    singInHtml = html`
      <span class="sign-in error" @click=${signOut}>
      <span> Failed to Sign in! </span>
      <div class="knight dead">♞</div>
      </span>
    `
  } else if (user) {
    const singOutHtml = html`
      <div @mouseout=${e => toggleSignOut(false)} v-if="shouldShowSignOut">
        <div @click=${signOut} class="sign-out">Sign Out</div>
      </div>
    `
    singInHtml = html`
      <span class="sign-in">
      <span @mouseover=${e => toggleSignOut(true)}>Signed in as ${user}</span>
      <div class="knight">♞</div>
      ${shouldShowSignOut ?  singOutHtml : ''}
      </span>
    `
  } else if (user === null) {
    singInHtml = html`
      <span class="sign-in">
      <span> Connecting to Lichess </span>
      <div class="knight spin">♞</div>
      </span>
    `
  } else {
    singInHtml = html`
      <span class="sign-in">
      <a href=${signInLink}>Sign In With Lichess</a>
      <div class="knight">♞</div>
      </span>
    `
  }

  const headerHtml = html`
    <header>
      <span> 
        <span class="hamburger" @mouseover=${switchNav}>☰</span> 
        <span class="main-title">Ye Old Wizard</span>
      </span>
      ${singInHtml}
    </header>
  `
  return headerHtml
}

function toggleSignOut(shouldShow) {
  shouldShowSignOut = shouldShow
  doRender()
}

// function signIn() {
//   user = 'thinktt'
//   doRender()
// }

function signOut() {
  user = undefined
  signInFailed = false;
  delLichessToken()
  delete window.localStorage.user
  delete window.localStorage.tokens
  games = {}
  doRender()
}

function switchNav() {
  console.log('switchNav')
  doRender()
}

const oauthUrl = 'https://lichess.org/oauth' 
const oauthQuery = '?response_type=code'
const scope = 'board:play'
let yowProxyUrl = 'https://yowproxy.herokuapp.com'
const clientId = 'L47TqpZn7iaJppGM'
let redirectUri = 'https://thinktt.github.io/yeoldwizard'
let devHost = localStorage.devHost || 'localhost:8080'
let tokens, codeChallenge


const  signInLink = oauthUrl + oauthQuery + '&scope=' + scope + '&client_id=' + clientId + '&redirect_uri=' + redirectUri + 
'&code_challenge_method=S256' + '&code_challenge=' + codeChallenge +
'&state=12345'
let signInFailed = false
let user = ''
let shouldShowSignOut = false


const mainEl = document.querySelector('wiz-header') 
function doRender(state ) {
  render(getHeaderHtml(state), mainEl)
}

export default { doRender }






