import games from './games.js'
window.games = games

const oauthUrl = 'https://oauth.lichess.org/oauth/authorize' 
const oauthQuery = '?response_type=code'
const scope = 'board:play'

const clientId = 'L47TqpZn7iaJppGM'
let yowProxyUrl = 'https://yowproxy.herokuapp.com'
let redirectUri = 'https://thinktt.github.io/yeoldwizard'
// yowProxyUrl = 'http://localhost:5000'


let tokens

// a way to get dev to work using the same lichess client id
if (localStorage.redirectToDev === 'true' && window.location.search && 
  window.location.hostname !== 'localhost') {
  console.log('Forwarding to dev')
  const query = window.location.search 
  window.location = "http://localhost:8080" + query
}

doAccountFlow()

async function doAccountFlow() {

  // User is already signed in and stored in
  if (window.localStorage.user) {
    console.log('User ' + window.localStorage.user + ' found')
    
    const app = await startApp(window.localStorage.user)
    tokens = JSON.parse(localStorage.tokens) 
    app.games = await games.updateGameList(window.localStorage.user)
    const currentGame =  await games.getCurrentLatestGame() || {}
    
    if (currentGame.id) {
      app.currentGame = currentGame.id
      app.toggleSelectionLock({name: currentGame.opponent })
      app.infoMode = "started"
      await new Promise(resolve => setTimeout(resolve, 50))
    } 
    
    app.isHidden = false
    return
  }

  // first check if this is a Athorization callback
  const authCodeRegex = /code\=([a-f0-9]*)/
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
      let url = yowProxyUrl + '/token' + query
      let res = await fetch(url)
      console.log('response: ', res.status, res.statusText)
      const tokens = await res.json() 
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

      // now that we have an account update users game list
      app.games = await games.updateGameList(account.username)

    } catch (err) {
      app.signInFailed = true
      app.setError("There was an error signing into Lichess")
      console.log(err)
    }
    return     
  }
  
  // startApp with no user starts app in a singed out state
  startApp()
}

async function startApp(user) {
  
  const res = await fetch('personalities.json')
  const cmpsObj = await res.json()
  const cmps = Object.entries(cmpsObj).map(e => e[1]).reverse()

  window.cmpsObj = cmpsObj

  const app = new Vue({
    el: '#app',
    data: {
      user: user,
      isHidden: true,
      games: {},
      signInFailed: false,
      selected: cmpsObj.Chessmaster,
      navIsOn: false,
      infoMode: 'browsing',
      currentGame: 'RklLOoMREuDI',
      currentOpponent: '',
      shouldShowSignOut: false,
      selectionIsLocked: false,
      isInPlayMode: false,
      isStartingGame: false,
      isSignedIn: Boolean(user),
      gameIsStarted: false,
      gameUrl: '',
      scrollPosition: 0,
      errorMessage: 'Things fall apart',
      signInLink: oauthUrl + oauthQuery + '&scope=' + scope + '&client_id=' + clientId + '&redirect_uri=' + redirectUri,
      groups : [
        {
          title: 'The Wizard',
          high: 3000,
          low: 2701,
          cmps: [],
        }, 
        {
          title: 'The Grandmasters',
          high: 2701,
          low: 2700,
          cmps: [],
          isGms: true,
        }, 
        {
          title: 'The Masters',
          high: 2650,
          low: 2000,
          cmps: [],
        },
        {
          title: 'Club Players',
          high: 2000,
          low: 1500,
          cmps: [],
        },
        {
          title: 'Casual Players',
          high: 1500,
          low: 1000,
          cmps: [],
        },
        {
          title: 'Beginners',
          high: 1000,
          low: 500,
          cmps: [],
        },
        {
          title: 'Noobs',
          high: 500,
          low: 0,
          cmps: [],
        },
      ]
    },
    methods: {
      switchNav(event) {
         this.navIsOn = true
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

        
        if (this.infoMode === 'browsing') {
          this.setSelectionLock()
          return
        }

        this.stopSelectionLock()
      },
      setSelectionLock() {
        this.infoMode = 'selected'
        this.selectionIsLocked = true
        this.scrollPosition = document.documentElement.scrollTop || document.body.scrollTop
        this.lockBody()
      },
      stopSelectionLock(){
        this.infoMode = 'browsing'
        this.selectionIsLocked = false
        this.unlockBody()
        if (isInPhoneMode()) {
          document.documentElement.scrollTop = document.body.scrollTop = this.scrollPosition;
        }
      },
      lockBody() {
        if  (isInPhoneMode()) document.body.style.position = 'fixed'
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
        delete window.localStorage.user
        delete window.localStorage.tokens
      },
      setError(message) {
        this.selected = cmpsObj.Chessmaster
        this.selectionIsLocked = true
        this.navIsOn = false
        this.infoMode = 'error'
        this.errorMessage = message
      },
      clearError() {
        this.selectionIsLocked = false
        this.infoMode = "browsing"
        if (this.signInFailed) this.signOut()
      },
      openGame() {
        window.open('https://lichess.org/' + this.currentGame, '_blank')
      },
      async startGame(opponent) {
  
        // be sure to send our alias to lichess to stay consistent
        opponent = getAlias(opponent)
      
        this.infoMode = 'starting'
      
        console.log(`Attempting to start a game with ${opponent}`)
        const tokens = JSON.parse(window.localStorage.tokens)
        this.isStartingGame = true
        // console.log(tokens.access_token)
      
        const res = await fetch('https://lichess.org/api/challenge/yeoldwiz', {
          method: 'POST',
          body: { rated: false, message: `yoeldwiz {game} started with ${opponent}` },
          headers: { 'Authorization' : 'Bearer ' + tokens.access_token}
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
        this.infoMode = 'started'
        return true
      
      },
    }
  })

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
    'Chessmaster' : 'Wizard',
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
  console.log(tokens.access_token)

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

function isInPhoneMode () {
  return window.matchMedia('(max-width: 1080px)').matches
}

