// import * as Vue from from 'https://unpkg.com/vue@3.2.45/dist/vue.esm-browser.js'
// import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import * as Vue from 'https://cdn.jsdelivr.net/npm/vue@3.2.45/dist/vue.esm-browser.js'
import { loadModule } from 'https://cdn.jsdelivr.net/npm/vue3-sfc-loader@0.8.4/dist/vue3-sfc-loader.esm.js'
import games from './games.js'
window.games = games

const oauthUrl = 'https://lichess.org/oauth' 
const oauthQuery = '?response_type=code'
const scope = 'board:play'

// let redirectUri = 'http://localhost:8080'
// yowProxyUrl = 'http://localhost:5000'

let yowProxyUrl = 'https://yowproxy.herokuapp.com'
const clientId = 'L47TqpZn7iaJppGM'
let redirectUri = 'https://thinktt.github.io/yeoldwizard'
let devHost = localStorage.devHost || 'localhost:8080'
let tokens, codeChallenge

// Will always keep the same code in local storage but generate a new one if none
// exist. Uncertain security, probably proper way is generate for every oauth call
// localStorage.codeVerifier = localStorage.codeVerifier || genRandomString()
// let codeChallenge = await genChallengeCode(localStorage.codeVerifier)
// localStorage.codeVerifier = 'c1g4WFR2LXp5QVBSNWttfjhMN1c0VDVpNkdqbVhtYUlyanhIRU1RSVJUTWZ4dEZQMnZ0X2VtLUZhQ053c2pCQU11X1I3Y09TX1VtN1FlNWNnUX45c2NXdUphLnN1TVBv'
// let codeChallenge = 'JGrp5Yhr6TGb-FDKSGe29mCvPNbxcwemmOF_gxFJ4E0'
// window.genChallengeCode = genChallengeCode


const options = {
  moduleCache: { vue: Vue },
  getFile (url) {
    const text = fetch(url).then(res => res.text())
    return text
  }, 
  addStyle: (textContent) => {
    const style = Object.assign(document.createElement('style'), { textContent });
    const ref = document.head.getElementsByTagName('style')[0] || null;
    document.head.insertBefore(style, ref);
  },
}
const myComp = await loadModule('./header.vue', options)
window.app = Vue.createApp({data() {}})
app.component('wiz-header', myComp)
app.mount('#app')

// a way to get dev to work using the same lichess client id
if (localStorage.redirectToDev === 'true' && window.location.search && 
    window.location.host !== devHost) {
      console.log('Forwarding to dev')
      const query = window.location.search 
      window.location = `http://${devHost}` + query
}

// doAccountFlow()

async function doAccountFlow() {
  localStorage.codeVerifier = localStorage.codeVerifier || genRandomString()
  codeChallenge = await genChallengeCode(localStorage.codeVerifier)

  // User is already signed in and stored in localstorage
  if (window.localStorage.user) {
    console.log('User ' + window.localStorage.user + ' found')
    const app = await startApp(window.localStorage.user)
    tokens = JSON.parse(localStorage.tokens) 
        
    app.loadUserGames()
    if (!app.slectionIsLocked && localStorage.lastCmp) {
      window.location.hash = `#${localStorage.lastCmp}` 
    }
    return
  }

  // first check if this is a Athorization callback
  const authCodeRegex = /code\=([_a-zA-Z0-9]*)/
  const match = authCodeRegex.exec(window.location.search.substr(1))
  if (match) {

    // go ahead and clear the query string as we no longer need it
    window.history.replaceState({}, null, window.location.origin + window.location.pathname)
    
    //null starts the app with knight spining to show it's trying to connect
    const app = await startApp(null)
    
    console.log("Auth callback detected, attempting to fetch tokens")
    const code = match[1]
    const query =  `?code=${code}&redirect_uri=${redirectUri}`
    try {
      // let url = yowProxyUrl + '/token' + query
      let body = {
        grant_type : 'authorization_code',
        code: code,
        code_verifier: localStorage.codeVerifier,
        redirect_uri: redirectUri,
        client_id: clientId,
      }

      let url = 'https://lichess.org/api/token'
      let res = await fetch(url, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        method: 'POST',
        body: new URLSearchParams(body)
      })
      if (!res.ok) throw res.error

      tokens = await res.json() 
      console.log('Setting tokens in local storage')
      tokens.fetchTime = Math.floor(Date.now() / 1000)
      window.localStorage.tokens = JSON.stringify(tokens)
  
      res = await fetch('https://lichess.org/api/account', {
        headers: {
          'Authorization' : 'Bearer ' + tokens.access_token, 
        }
      }) 
      if (!res.ok) throw res.error

      const account = await res.json()
      console.log('Setting user ' + account.username + ' in local storage')
      localStorage.user = account.username
      app.user = account.username

      // now that we have an account we can connnect to users games
      app.loadUserGames()

    } catch (err) {
      app.signInFailed = true
      app.setError("There was an error signing into Lichess")
      console.log(err)
      window.err = err
    }
    return     
  }
 
  // startApp with no user starts app in a singed out state
  startApp()
}

async function startApp(user) {
  
  const res = await fetch('personalities.json')
  const cmpsObj = await res.json()

  // Map the CMP Object to an array, sort them by rating, reverse them 
  // for top to bottom flow when building layout
  let cmps = Object.entries(cmpsObj).map(e => e[1])

  cmps.sort((cmp0, cmp1) => {
    if ( cmp0.rating < cmp1.rating ) return -1
    if ( cmp0.rating > cmp1.rating ) return 1
    if ( cmp0.rating === cmp1.rating ) return 0
  })
  cmps = cmps.reverse()

  window.cmpsObj = cmpsObj



  window.app = app

  for (const group of app.groups) {
    group.cmps = getRatingGroup(cmps, group.high, group.low)
  }

  // // make sure on resize the body is unlocked or locked as it should be
  window.onresize = () => {
    if (app.infoMode === 'browsing') {
      app.unlockBody()
    } else {
      app.lockBody()
    }
  }

  return app
}

function getRatingGroup(cmps, high, low) {
  const cmpGroup = cmps.filter(cmp => {
    return (cmp.rating >= low) && (cmp.rating < high) 
  }) 
  return cmpGroup.reverse()
}

function getAlias(opponent) {
 const aliases = {
    // 'Chessmaster' : 'Wizard',
    'Josh6': 'JW6',
    'Josh7': 'JW7',
    'Josh8': 'JW8',
    'Josh9': 'JW9',
    'Josh12': 'JW12',
  }
  return aliases[opponent] || opponent
}

async function checkGame(gameId) {
  console.log(gameId)

  const tokens = JSON.parse(window.localStorage.tokens)
  const res = await fetch('https://lichess.org/api/account/playing', {
    headers: { 'Authorization' : 'Bearer ' + tokens.access_token}
  })
  
  if (!res.ok) return false

  const games = await res.json()
  console.log('Checking for game', games.nowPlaying)
  for (const game of games.nowPlaying) {
    if (game.gameId === gameId) return true
  } 

  return false
}


async function setOpponent(gameId, opponent) {
  const tokens = JSON.parse(window.localStorage.tokens)
  const res1 = await fetch(`https://lichess.org/api/board/game/${gameId}/chat`, {
    headers: {
      'Authorization' : 'Bearer ' + tokens.access_token,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    method: 'POST',
    body: `room=player&text=${opponent}`,
  })

  if (!res1.ok) {
    console.log('Error posting in player chat')
    return false
  }

  return true
}

window.startStream = startStream
async function startStream(endpoint, callback) {
  const tokens = JSON.parse(window.localStorage.tokens)
  const reader = await fetch('https://lichess.org/api' + endpoint,  {
    headers: {'Authorization' : 'Bearer ' + tokens.access_token}
  }).then((res) => res.body.pipeThrough(new TextDecoderStream()).getReader())

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      const outs = value.split('\n')
      for (const out of outs) {
        if (out !== '') callback(JSON.parse(out))
      }
    }
  }
}

// killToken deletes the token from lichess
async function delLichessToken() {
  const res = await fetch(`https://lichess.org/api/token`, {
    headers: {
      'Authorization' : 'Bearer ' + tokens.access_token,
    },
    method: 'DELETE',
  })
  if ( res.status === 204 ) {
    console.log('Successfully deleted token from lichess')
  } else {
    console.log("Unable to delete token from lichess:", res.status, res.statusText )
  }

}

function isInPhoneMode () {
  return window.matchMedia('(max-width: 1080px)').matches
}

function genRandomString() {
  const PKCE_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const RECOMMENDED_CODE_VERIFIER_LENGTH = 96
  const output = new Uint32Array(RECOMMENDED_CODE_VERIFIER_LENGTH);
  crypto.getRandomValues(output);
  const randStr = base64urlEncode(Array
    .from(output)
    .map((num) => PKCE_CHARSET[num % PKCE_CHARSET.length])
    .join(''));
 
  return randStr
}


async function genChallengeCode(codeVerifier) {
  let codes = crypto
    .subtle
    .digest('SHA-256', (new TextEncoder()).encode(codeVerifier))
    .then((buffer) => {
      let hash = new Uint8Array(buffer);
      let binary = '';
      let hashLength = hash.byteLength;
      for (let i = 0; i < hashLength; i++) {
        binary += String.fromCharCode(hash[i]);
      }
      return binary;
    })
    .then(base64urlEncode)
    .then((codeChallenge) => ({ codeChallenge, codeVerifier }));

  return (await codes).codeChallenge;
}

function base64urlEncode(value) {
  let base64 = btoa(value);
  base64 = base64.replace(/\+/g, '-');
  base64 = base64.replace(/\//g, '_');
  base64 = base64.replace(/=/g, '');
  return base64;
}