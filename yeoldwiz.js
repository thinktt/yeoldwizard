import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import games from './games.js'
import WizFace from './WizFace.js'
import WizBadges from './WizBadges.js'
import WizBoard from './WizBoard.js'
import WizGames from './WizGames.js'
import WizKidInfo from './WizKidInfo.js'
import WizMessage from './WizMessage.js'
import router from './router.js'
import { cssLoader } from './pageTools.js'
window.games = games



cssLoader.render()

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


// a way to get dev to work using the same lichess client id
if (localStorage.redirectToDev === 'true' && window.location.search && 
    window.location.host !== devHost) {
      console.log('Forwarding to dev')
      const query = window.location.search 
      window.location = `http://${devHost}` + query
}

// more dev env shenanigins 
let dummyCode
if (window.location.host.includes('192.168')) {
  console.log('Using dummy account for local dev address')
  dummyCode = 'EzUA-uZDIDR-E6-8XZgnvVpr0KvYQwWAjiVUk3E7ZoY'
  window.localStorage.user = 'dummyjoe'
}

doAccountFlow()

async function doAccountFlow() {
  localStorage.codeVerifier = localStorage.codeVerifier || genRandomString()
  codeChallenge = dummyCode || await genChallengeCode(localStorage.codeVerifier)

  // User is already signed in and stored in localstorage
  if (window.localStorage.user) {
    console.log('User ' + window.localStorage.user + ' found')
    const app = await startApp(window.localStorage.user)
    tokens = JSON.parse(localStorage.tokens) 
        
    await app.loadUserGames()
    if (localStorage.lastCmp) {
      const selector = 'div[name="'  + localStorage.lastCmp + '"]'
      document.querySelector(selector).scrollIntoView({block: 'center'})
      await new Promise(r => setTimeout(r, 10))
      app.groupsAreHidden = false
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
      await app.loadUserGames()
      app.groupsAreHidden = false

    } catch (err) {
      app.signInFailed = true
      app.setError("There was an error signing into Lichess")
      console.log(err)
      window.err = err
    }
    return     
  }
 
  // startApp with no user starts app in a singed out state
  const app = await startApp()
  app.groupsAreHidden = false
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

  const app1= createApp({
    data() {
      const data = {
        user: user,
        isHidden: true,
        groupsAreHidden: true,
        games: {},
        signInFailed: false,
        selected: cmpsObj.Wizard,
        navIsOn: false,
        infoMode: 'browsing',
        wizKidMode: 'preview',
        messageType: 'none',
        message: 'Things fall apart',
        scoreMode: localStorage.scoreMode || 'ladder',
        currentGame: null,
        currentOpponent: '',
        shouldShowSignOut: false,
        selectionIsLocked: false,
        isInPlayMode: false,
        isStartingGame: false,
        isSignedIn: Boolean(user),
        gameIsStarted: false,
        gameUrl: '',
        scrollPosition: 0,
        signInLink: oauthUrl + oauthQuery + '&scope=' + scope + '&client_id=' + clientId + '&redirect_uri=' + redirectUri + 
          '&code_challenge_method=S256' + '&code_challenge=' + codeChallenge +
          '&state=12345',
        groups : [
          {
            title: 'The Wizard',
            high: 3000,
            low: 2701,
            cmps: [],
          }, 
          {
            title: 'Noobs',
            low: 0,
            high: 500,
            cmps: [],
          },
          {
            title: 'Beginners',
            low: 500,
            high: 1000,
            cmps: [],
          },
          {
            title: 'Casual Players',
            low: 1000,
            high: 1200,
            cmps: [],
          },
          {
            title: 'Park Players',
            low: 1200,
            high: 1350,
            cmps: [],
          },
          {
            title: 'Club Players',
            low: 1350,
            high: 1500,
            cmps: [],
          },
          {
            title: 'Tournament Players',
            low: 1600,
            high: 1800,
            cmps: [],
          },
          {
            title: 'Advanced Players',
            low: 1800,
            high: 2000,
            cmps: [],
          },
          {
            title: 'The Experts',
            low: 2000,
            high: 2200,
            cmps: [],
          },
          {
            title: 'The Masters',
            low: 2200,
            high: 2700,
            cmps: [],
          },
          {
            title: 'Classic Grandmasters',
            low: 2700,
            high: 2701,
            cmps: [],
            isGms: true,
          }, 
        ]
      }
      return data
    },
    methods : {
      select(cmp) {
        this.selected = cmpsObj[cmp.name]
        this.infoMode = 'selected'
        this.wizKidMode = 'control'
        this.navIsOn = false
        this.saveScrollPosition()
        localStorage.lastCmp = cmp.name
      },
      async deselect() {

        this.infoMode='browsing'
        this.wizKidMode = 'preview'
        this.navIsOn = false
        // this is a weird hack to get the scroll to return after the dom
        // re-renders the page, hide teh group and show it to avoid weird
        // ghost effects, hacky but works for now
        // await new Promise(r => setTimeout(r, 0))
        // this.scrollReturn()
        // this.groupsAreHidden = true
        // this.groupsAreHidden = false
      },
      goToGroup(groupTitle, cmp) {
        this.selected = cmp
        const selector = 'section[name="'  + groupTitle + '"]'
        document.querySelector(selector).scrollIntoView({block: 'start'})
        this.navIsOn = false
        history.pushState({}, null, '#')
        this.wizKidMode = 'preview'
      },
      showGames() {
        this.infoMode = 'games'
        this.navIsOn = false
      },
      switchScoreMode(mode) {
        this.scoreMode = mode
        localStorage.scoreMode = mode
      },
      switchNav(event) {
        this.navIsOn = true
        this.infoMode = 'browsing'
      },
      toggleNav() {
        if (isInPhoneMode()) {
          this.navIsOn = false
          this.infoMode = "browsing"
        } 
      },
      showCmp(cmp) {
        this.navIsOn = false
        if (!this.selectionIsLocked) {
          this.selected = cmpsObj[cmp.name]
        }
      },
      toggleSelectionLock(cmp) {
        // do nothing if infoMode has gone past 'selected', in this 
        // case we are in a state that should not unlock the selection 
        if (this.infoMode !== 'selected' && this.infoMode !== 'browsing') return
        
        this.navIsOn = false
        this.selected = cmpsObj[cmp.name]
        localStorage.lastCmp = cmp.name

        
        if (this.infoMode === 'browsing') {
          this.setSelectionLock()
          return
        }

        this.stopSelectionLock()
      },
      setSelectionLock() {
        this.infoMode = 'selected'
        this.selectionIsLocked = true
        localStorage.scrollPosition = document.documentElement.scrollTop || document.body.scrollTop
        // this.lockBody()
      },
      stopSelectionLock(){
        this.wizKidMode = 'preview'
        this.infoMode = 'browsing'
        this.selectionIsLocked = false
        this.unlockBody()
        if (isInPhoneMode()) {
          this.scrollReturn()
        }
      },
      saveScrollPosition() {
        localStorage.scrollPosition = document.documentElement.scrollTop || document.body.scrollTop
      },
      scrollReturn() {
        console.log('scroll return')
        document.documentElement.scrollTop = document.body.scrollTop = 
          parseInt(localStorage.scrollPosition) || 0
      },
      lockBody() {
        // if (isInPhoneMode()) document.body.style.position = 'fixed'
      },
      unlockBody() {
        document.body.style.position = ''
      },
      toggleSignOut(shouldShow) {
        this.shouldShowSignOut = shouldShow
      },
      signOut() {
        this.user = undefined
        this.signInFailed = false;
        delLichessToken()
        delete window.localStorage.user
        delete window.localStorage.tokens
        this.games = {}
      },
      setError(message) {
        this.route('')
        this.selected = cmpsObj.Wizard
        this.wizKidMode = 'message'
        this.messageType = 'error'
        this.message = message
        // this.navIsOn = false
        // this.infoMode = 'selected'
      },
      clearError() {
        // this.selectionIsLocked = false
        this.infoMode = 'browsing'
        this.wizKidMode = 'preview'
        this.messageType = 'none'
        if (this.signInFailed) this.signOut()
      },
      clearMessage() {
        router.unlock()
        this.wizKidMode = 'control'
        this.messageType = 'none'
        this.message = ''
        // this.route('')
      },
      openGame() {
        window.open('https://lichess.org/' + this.currentGame, '_blank')
      },
      async startGame(opponent) {
        // be sure to send our alias to lichess to stay consistent
        this.wizKidMode = 'message'
        router.lock()
        opponent = getAlias(opponent)
        
        const colorToPlay = games.getColorToPlay(opponent)

        this.messageType = 'starting'
      
        console.log(`Attempting to start a game with ${opponent}`)
        const tokens = JSON.parse(window.localStorage.tokens)
        this.isStartingGame = true
        // console.log(tokens.access_token)
      
        const res = await fetch('https://lichess.org/api/challenge/yeoldwiz', {
          method: 'POST',
          headers: { 
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization' : 'Bearer ' + tokens.access_token
          },
          body: new URLSearchParams({
            rated: false, 
            color: colorToPlay,
            message: `yoeldwiz {game} started with ${opponent}` 
          }),
        })
      
        if (!res.ok) {
          this.isStartingGame = false
          return false
        }
        const challenge = await res.json()
        const gameId = challenge.challenge.id
      
        // give some time for the game to start, this is crappy but hopefuly works
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        if ( !(await checkGame(gameId)) ) {
          console.log('Game did not start')
          this.setError('Game did not start')
          return false
        }
      
        console.log(`${gameId} started!`)
        if (!await setOpponent(gameId, opponent)) {
          console.log('Game started unalbe to set opponent')
          this.setError('Game started but unalbe to set opponent')
          return false
        }
      
        games.addCurrentGame({id: gameId, opponent, })
        this.currentGame = gameId
        this.messageType = 'started'

        this.connectToStream(gameId)

        return true
      },
      async loadUserGames() {
        this.games = await games.updateGameList(window.localStorage.user)
        const currentGame =  await games.getCurrentLatestGame() || {}
        if (currentGame.id) {
          this.route('selected', currentGame.opponent)
          this.messageType = "started"
          this.wizKidMode = 'message'
          this.currentGame = currentGame.id
          this.connectToStream(currentGame.id)
          router.lock()
        } 
      },
      connectToStream(gameId) {
        startStream(`/board/game/stream/${gameId}`, (data) => {
          switch(data.type) {
            case 'gameFull': 
              console.log(`Succefully connected to Game:`)
              console.log(data.id, data.createdAt, data.state.status) 
              break;
            case 'gameState':
              const endStates = ['mate', 'resign', 'stalemate', 'aborted']
              if (endStates.includes(data.status)) {
                console.log('Game ended!')
                this.messageType = 'ended'
                this.message = `You have completed your game with ${this.selected.name}`
                this.loadUserGames()
              }
            default: 
          } 
        })
      },
    }
  })
  const customElements = ['piece', 'square']
  app1.config.compilerOptions.isCustomElement = tag => customElements.includes(tag)
  app1.component('WizFace', WizFace)
  app1.component('WizBadges', WizBadges)
  app1.component('WizBoard', WizBoard)
  app1.component('WizGames', WizGames)
  app1.component('WizKidInfo', WizKidInfo)
  app1.component('WizMessage', WizMessage)
  const app = app1.mount('#app')
  router.loadApp(app, cmpsObj)
  app.route = router.route
  // clear any previous routes, aint nobody got time for that
  app.route()
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