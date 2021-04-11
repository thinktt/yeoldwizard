const oauthUrl = 'https://oauth.lichess.org/oauth/authorize' 
const oauthQuery = '?response_type=code'
const scope = 'board:play'

const clientId = 'L47TqpZn7iaJppGM'
let yowProxyUrl = 'https://yowproxy.herokuapp.com'
let redirectUri = 'https://thinktt.github.io/yeoldwizard'


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
  if (window.localStorage.user) {
    console.log('User ' + window.localStorage.user + ' found')
    startApp(window.localStorage.user)
    tokens = JSON.parse(localStorage.tokens) 
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

  const app = new Vue({
    el: '#app',
    data: {
      user: user,
      signInFailed: false,
      selected: cmpsObj.Chessmaster,
      navIsOn: false,
      infoMode: 'browsing',
      currentGame: 'RklLOoMREuDI',
      shouldShowSignOut: false,
      selectionIsLocked: false,
      isInPlayMode: false,
      isStartingGame: false,
      isSignedIn: Boolean(user),
      gameIsStarted: false,
      gameUrl: '',
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
        const mediaQuery = window.matchMedia('(max-width: 1080px)') 
        if (mediaQuery.matches) {
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
          this.infoMode = 'selected'
          this.selectionIsLocked = true
          return
        } else {
          this.infoMode = 'browsing'
          this.selectionIsLocked = false
        }
      },
      stopSelectionLock(){
        this.infoMode = 'browsing'
        this.selectionIsLocked = false
        window.location = '/#' + this.selected.name

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
      startGame,
    }
  })

  for (const group of app.groups) {
    group.cmps = getRatingGroup(cmps, group.high, group.low)
  }

  return app
}

function getRatingGroup(cmps, high, low) {
  const cmpGroup = cmps.filter(cmp => {
    return (cmp.rating >= low) && (cmp.rating < high) 
  }) 
  return cmpGroup.reverse()
}

async function startGame(opponent) {
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

  this.currentGame = gameId
  this.infoMode = 'started'
  return true

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

async function getUserStream() {
  const tokens = JSON.parse(window.localStorage.tokens)
  console.log(tokens.access_token)

  const reader = await fetch('https://lichess.org/api/stream/event',  {
    headers: {'Authorization' : 'Bearer ' + tokens.access_token}
  }).then((res) => res.body.pipeThrough(new TextDecoderStream()).getReader())

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      console.log(value)
      console.log(value.length)
    }
  }
}