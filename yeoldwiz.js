import { createApp } from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'
import games from './games.js'
import WizFace from './WizFace.js'
import WizBadges from './WizBadges.js'
import WizBadges2 from './WizBadges2.js'
import WizBoard from './WizBoard.js'
import WizBoard2 from './WizBoard2.js'
import WizBoardNav from './WizBoardNav.js'
import WizBoardRoom from './WizBoardRoom.js'
import WizGames from './WizGames.js'
import WizGameStatus from './WizGameStatus.js'
import WizKidInfo from './WizKidInfo.js'
import WizMessage from './WizMessage.js'
import WizTrophies from './WizTrophies.js'
import WizTrophy from './WizTrophy.js'
import WizLoader from './WizLoader.js'
import router from './router.js'
import { cssLoader } from './pageTools.js'
import lichessApi from './lichessApi.js'
import { applyAnimation } from './lib/chessground/js/config.js'
import { Chessground } from './lib/chessground/js/chessground.js'
import yowApi from './yowApi.js'
import { start } from './lib/chessground/js/draw.js'
window.games = games
const codeVerifier = localStorage.codeVerifier

// cssLoader.render()
const pathName = window.location.pathname || '/'
localStorage.rootPath = window.location.origin + pathName
let devHost = localStorage.devHost || 'localhost:8080'
let tokens
let botBrowsingIsSet = false

// flush local db if we changed the format since user used the app
const dbVersion = '1.1'
if (localStorage.dbVersion !== dbVersion) { 
  console.log(`DB does not match current version, flushing db`)
  localStorage.clear()
}
localStorage.dbVersion = dbVersion


// a way to get dev to work using the same lichess client id
if (localStorage.redirectToDev === 'true' && window.location.search && 
    window.location.host !== devHost) {
      console.log('Forwarding to dev')
      const query = window.location.search 
      window.location = `http://${devHost}` + query
} else {
  await doAccountFlow()
  await checkLegalStuff()
}

function clearQuery() {
  window.history.replaceState({}, null, window.location.origin + window.location.pathname)
}

function redirectToSignIn() {
  window.location = window.location.origin + '/signin'
}

async function doAccountFlow() {
  // check query for botBrowsing
  if (window.location.search.includes('botBrowsing=true')) {
    clearQuery()
    botBrowsingIsSet = true
    return
  }

  // check for athorization callback
  const authCodeRegex = /code\=([_a-zA-Z0-9]*)/
  const authCode = authCodeRegex.exec(window.location.search.substring(1))
  
  // go ahead and clear the query string as we no longer need it
  clearQuery()
  
  // no auth code was found, so we are done
  if (!authCode) {
    return
  }

  // we have and auth code to process now
  console.log("Auth callback detected, attempting to fetch tokens")
  const code = authCode[1]
  let err = null
  const token = await lichessApi.getToken(code, codeVerifier).catch(e => err = e)
  if (err) {
    console.error('failed to get token', err.message)
    localStorage.signInFailed = true
    return
  }
  lichessApi.storeToken(token)
    
  err = null
  const account = await lichessApi.getAccount().catch(e => err = e)
  if (err) {
    console.error('failed to get account', err.message)
    localStorage.signInFailed = true
    return
  }
    
  console.log('Setting user ' + account.username + ' in local storage')
  localStorage.user = account.username
  console.log('Successfully signed in as ' + account.username)
  
  return
}

async function checkLegalStuff() {
  const user = localStorage.user
  const engineIsVerified = localStorage.engineIsVerified === 'true'
  const disclaimerIsAccepted = localStorage.disclaimerIsAccepted === 'true'
  // const botBrowsingIsSet = localStorage.botBrowsingIsSet === 'true'
  const signInFailed = localStorage.signInFailed === 'true'
  
  // this allows the app to run singed out for bot browsing
  if (!user && botBrowsingIsSet) {
    localStorage.botBrowsingIsSet = false
    botBrowsingStart()
    return
  }

  // no user or sign in failed, so go to sign in page
  if (!user || signInFailed ) {
    redirectToSignIn()
    return
  }

  // has the user done the legal stuff, if so we're good
  if (engineIsVerified && disclaimerIsAccepted) {
    console.log(user + ' has done the legal stuff')
    preStart()
    return
  }

  // let's check yowApi to see if the user has done the legal stuff
  console.log('Checking yowApi for user ' + user)
  let err = null
  const yowUser = await yowApi.getUser(user).catch(e => err = e)
  if (err) {
    console.error('failed to get yow user', err.message)
    redirectToSignIn()
    return
  }

  // user is registered so mark legal stuff as done
  console.log(yowUser)
  localStorage.engineIsVerified = true
  localStorage.disclaimerIsAccepted = true

  preStart()
}


async function botBrowsingStart() {
  const app = await startApp('') // start with no user
  app.groupsAreHidden = false
  games.setDemoGames()
}

async function preStart() {
  // User is already signed in and stored in localstorage
  if (window.localStorage.user) {

    console.log('User ' + window.localStorage.user + ' found')
    const app = await startApp(window.localStorage.user)
    tokens = JSON.parse(localStorage.tokens) 
    
    app.isLoading = true
    await app.loadUserGames()
    app.isLoading = false
    await new Promise(r => setTimeout(r, 0))
    app.goToCmp(localStorage.lastCmp || 'Wizard')
    app.groupsAreHidden = false
    return
  }
  
  const app = await startApp('') // start with no user
  app.groupsAreHidden = false
}


async function startApp(user) {
  const res = await fetch('personalities.json')
  const signInLink = await lichessApi.getSignInLink(codeVerifier)
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
        currentGameId: null,
        currentGame: {},
        currentOpponent: '',
        boardGame: {
          id: "i8ximyUz",
          createdAt: 1618120201189,
          status: "mate",
          conclusion: "lost",
          playedAs: "white",
          link: "https://lichess.org/i8ximyUz",
          wasForwardedToYowApi: true,
          moves: [],
        },
        drawOfferState: '',
        isLoading: false,
        loadState : {
          nullGameCount : 0, 
          found: 0, 
          loaded: 0, 
          toGet: 0, 
          total: 0, 
          isDone: false
        },
        shouldShowSignOut: false,
        selectionIsLocked: false,
        isInPlayMode: false,
        isStartingGame: false,
        isSignedIn: Boolean(user),
        gameIsStarted: false,
        gamesPageRefreshKey: 0,
        gameUrl: '',
        scrollPosition: 0,
        signInLink: signInLink,
        groups : [
          {
            title: 'The Wizard',
            high: 3000,
            low: 2701,
            cmps: [],
            trophy: 'goldenqueen'
          }, 
          {
            title: 'Noobs',
            low: 0,
            high: 500,
            cmps: [],
            trophy: 'goldenpawn'
          },
          {
            title: 'Beginners',
            low: 500,
            high: 1000,
            cmps: [],
            trophy: 'goldenpawn'
          },
          {
            title: 'Casual Players',
            low: 1000,
            high: 1200,
            cmps: [],
            trophy: 'goldenknight'
          },
          {
            title: 'Park Players',
            low: 1200,
            high: 1350,
            cmps: [],
            trophy: 'goldenbishop'
          },
          {
            title: 'Club Players',
            low: 1350,
            high: 1550,
            cmps: [],
            trophy: 'goldenknight'
          },
          {
            title: 'Tournament Players',
            low: 1550,
            high: 1800,
            cmps: [],
            trophy: 'goldenbishop'
          },
          {
            title: 'Advanced Players',
            low: 1800,
            high: 2000,
            cmps: [],
            trophy: 'goldenrook'
          },
          {
            title: 'The Experts',
            low: 2000,
            high: 2200,
            cmps: [],
            trophy: 'goldenrook'
          },
          {
            title: 'The Masters',
            low: 2200,
            high: 2700,
            cmps: [],
            trophy: 'goldenqueen'
          },
          {
            title: 'Classic Grandmasters',
            low: 2700,
            high: 2701,
            cmps: [],
            isGms: true,
            trophy: 'goldenking'
          }, 
        ]
      }
      return data
    },
    methods : {
      async doMove(move) {
        const moves = this.boardGame.moves.slice()
        moves.push(move)
        this.boardGame.moves = moves
        let err
        const res = await lichessApi.makeMove(this.boardGame.id, move).catch((e) => err = e )
        if (err) {
          console.log('Error making move', err)
          return
        }
        this.checkForDeadStream()
      },
      async checkForDeadStream() {
        console.log('checking for dead stream')
        const checkTime = Date.now()
        await new Promise(r => setTimeout(r, 1000))
        const timeGap = checkTime - this.currentGame.lastEventTime
        console.log('checkTime:', checkTime)
        console.log('lastEventTime:', this.currentGame.lastEventTime)
        console.log('gap:', timeGap)
        // if the last even time is greater than the check time no event came through
        if (timeGap > 0) {
          console.log('looks like a dead stream, restarting')
          this.currentGame.stream = await this.currentGame.stream.restart()
        }
      },
      async doQuitAction(action) {
        switch(action) {
          case 'resign':
             lichessApi.resign(this.boardGame.id)
             break;
          case 'offerDraw':
             lichessApi.offerDraw(this.boardGame.id)
             this.drawOfferState = 'offered'
             await new Promise(r => setTimeout(r, 5000))
             if (this.drawOfferState === 'offered') this.drawOfferState = 'ignored'
             break;
          case 'abort':
             lichessApi.abortGame(this.boardGame.id)
             break;
          case 'drawWasIgnored':
             this.drawOfferState = 'ignored'
             break;
          case 'clearDrawOffer': 
            this.drawOfferState = ''
        }
      },
      hasTrophy(group, games) {
        return hasTrophy(group, games)
      },
      routeToCmp(cmp) {
        // hackery to play demo games when not signed in
        if (botBrowsingIsSet && !isInPhoneMode()) {
          this.showDemo(cmp)
          return
        }
        this.route('selected', cmp.name)
      },
      showDemo(cmp) {
        games.hackDemoOpponetName(cmp.name)
        this.route('board', 'dXI5xOQ4')
      },
      select(cmp) {
        this.selected = cmpsObj[cmp.name]
        this.infoMode = 'selected'
        this.wizKidMode = 'control'
        this.navIsOn = false
        this.saveScrollPosition()
        localStorage.lastCmp = cmp.name
        this.scrollToTop()
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
      goToCmp(cmpName) {
        const selector = 'div[name="'  + cmpName + '"]'
        document.querySelector(selector).scrollIntoView({block: 'center'})
      },
      goToCurrentGame() {
        this.loadBoard(this.currentGame)
      },
      showGames() {
        this.infoMode = 'games'
        this.navIsOn = false
        this.gamesPageRefreshKey ++
      },
      showTrophies() {
        this.infoMode = 'trophies'
        this.navIsOn = false
      },
      async loadBoard(game) {
        this.boardGame = game
        await new Promise(r => setTimeout(r, 0))
        this.selected = cmpsObj[game.opponent]
        this.route('board', game.id)
      },
      showBoard(gameId) {
        if (this.boardGame.id !== gameId) {
          let game 
          if (gameId === this.currentGame.id) game = this.currentGame
          else game = games.getGameById(gameId) 
          this.loadBoard(game)
        }
        this.infoMode = 'board'
        this.wizKidMode = 'control'
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
      scrollToTop() {
        document.documentElement.scrollTop = 0
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
        window.localStorage.lastCmp = 'Wizard'
        this.goToCmp('Wizard')
        this.games = {}
        // localStorage.removeItem('engineIsVerified')
        // localStorage.removeItem('disclaimerIsAccepted')
        app1.unmount()
        window.location = localStorage.rootPath + 'signin' 
      },
      clearLegal() {
        localStorage.engineIsVerified = false
        localStorage.disclaimerIsAccepted = false
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
        window.open('https://lichess.org/' + this.currentGameId, '_blank')
      },
      async startGame(opponent) {
        // be sure to send our alias to lichess to stay consistent
        this.wizKidMode = 'message'
        // router.lock()
        opponent = getAlias(opponent)
        
        const colorToPlay = games.getColorToPlay(opponent)

        this.messageType = 'starting'
      
        console.log(`Attempting to start a game with ${opponent}`)
        const tokens = JSON.parse(window.localStorage.tokens)
        this.isStartingGame = true
      
        const res = await lichessApi.createChallenge(colorToPlay)
      
        if (!res.ok) {
          this.isStartingGame = false
          return false
        }
        const challenge = await res.json()
        const gameId = challenge.challenge.id
        setOpponentInYowApi(gameId, opponent)

      
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
        this.currentGameId = gameId
        
        await this.loadUserGames()
        this.messageType = 'none'

        return true
      },
      async loadUserGames() {
        games.setUser(window.localStorage.user)
        await games.loadGames(this.loadState)
        this.games = games.getGamesByOpponent()
        const currentGame =  await games.getCurrentLatestGame() || {}
        if (currentGame.id) {
          // this.route('selected', currentGame.opponent)
          this.currentGameId = currentGame.id
          this.currentGame = currentGame
          await this.connectToStream(currentGame.id)
          return
        } 
        this.currentGameId = null
      },
      async connectToStream(gameId) {
        const boardGame = this.currentGame //games.getCurrentLatestGame() || {}
        console.log(`Attempting to stream ${boardGame.id}`)
        
        let resolve
        const startPromise = new Promise(r => resolve = r)
        this.currentGame.stream = await lichessApi.getGameStream(boardGame.id, async (event) => {
          switch(event.type) {
            case 'gameFull': 
              console.log(`Succefully connected to Game:`)
              console.log(event.id, event.createdAt, event.state.status) 
              
              boardGame.moves = event.state.moves ? event.state.moves.split(' ') : []
              if (event.white.id == this.user) { 
                boardGame.playedAs = 'white'
              } else {
                boardGame.playedAs = 'black'
              }
              await this.loadBoard(boardGame)
              this.currentGame.lastEventTime = Date.now()
              resolve()
              break;
            case 'gameState':
              this.currentGame.lastEventTime = Date.now()
              this.currentGame.moves = event.moves.split(' ')
              if (this.boardGame.id === this.currentGame.id) {
                this.boardGame.move = this.currentGame.moves
              }
                // this.currentGame = this.boardGame
              if (event.status === 'aborted') {
                this.route('back')
                this.messageType = 'none'
                this.loadUserGames()
                return
              }
             const endStates = ['mate', 'resign', 'stalemate', 'aborted', 'draw']
             if (endStates.includes(event.status)) {
                // console.log(event)
                console.log('Game ended!')
                // this.messageType = 'ended'
                // this.message = `You have completed your game with ${this.selected.name}`
              
                // a hacky way to update the board game status in real time
                // need to create a better state flow from games module
                if (event.status !== 'aborted') this.boardGame.hasJustEnded = true
                this.boardGame.status = event.status
                this.boardGame.lastMoveAt = Date.now()
                if (event.status === 'draw' || event.status === 'stalemate') { 
                  this.boardGame.conclusion = 'draw'
                  this.boardGame.drawType = games.getDrawType(this.boardGame.conclusion, this.boardGame.moves)
                } else if (this.boardGame.playedAs === event.winner) {
                  this.boardGame.conclusion = 'won'
                } else {
                  this.boardGame.conclusion = 'lost'
                }
                
                this.loadUserGames()
              }
              break;
            case 'chatLine': 
              if (event.username === 'lichess' && event.text.includes('declines draw') ) {
                this.drawOfferState = 'declined'
              }
              break;
            default: 
              console.log('unhandled game event: ' +  event.type)
              console.log(event)
          } 
        }, () => {
          console.log(`game stream ${boardGame.id} has ended`)
        })

        return startPromise
      },
    },
    watch: {
      drawOfferState(newState, oldState) {
        console.log(`drawOfferState  OLD:${oldState || 'none'} NEW:${newState || 'none'}`)
      }
    }
  })

  const customElements = ['piece', 'square']
  app1.config.compilerOptions.isCustomElement = tag => customElements.includes(tag)
  app1.component('WizFace', WizFace)
  app1.component('WizBadges', WizBadges)
  app1.component('WizBadges2', WizBadges2)
  app1.component('WizBoardRoom', WizBoardRoom)
  app1.component('WizBoard', WizBoard)
  app1.component('WizBoard2', WizBoard2)
  app1.component('WizBoardNav', WizBoardNav)
  app1.component('WizGames', WizGames)
  app1.component('WizGameStatus', WizGameStatus)
  app1.component('WizKidInfo', WizKidInfo)
  app1.component('WizMessage', WizMessage)
  app1.component('WizTrophies', WizTrophies)
  app1.component('WizTrophy', WizTrophy)
  app1.component('WizLoader', WizLoader)
  const app = app1.mount('#app')
  router.loadApp(app, cmpsObj)
  app.route = router.route
  // clear any previous routes, aint nobody got time for that
  app.route()
  window.app = app

  for (const group of app.groups) {
    group.cmps = getRatingGroup(cmps, group.high, group.low)
  }


  function hasTrophy(group, games) {
    const hasTrophy = true
    for (const cmp of group.cmps) {
      if (games[cmp.name].score < 2) {
        hasTrophy = false
        break
      }
    }
    return hasTrophy
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

async function setOpponentInYowApi(gameId, opponent) {
  const user = localStorage.user
  const res = await yowApi.addGame({id: gameId, user, opponent})
  if (res.ok) {
    console.log('current game Id and opponent sent to yowApi')
    return true
  }
  console.log('failed to set opponent in yowApi')
}

async function setOpponent(gameId, opponent) {
  console.log('attempting to set opponent in chat')
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

