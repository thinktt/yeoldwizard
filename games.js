import yowApi from './yowApi.js'
import lichessApi from './lichessApi.js'

export default { 
  updateGameList,
  getGames, 
  getColorToPlay,
  getCurrentGames,
  getCurrentLatestGame,
  addCurrentGame,
  deleteCurrentGame,
  clearGames,
  clearCurrentGames,
  deDupeGames,
  clearWasForwardedToYowApi,
}

let yowProxyUrl = 'https://yowproxy.herokuapp.com'

// module globals
let user = ''

// Check if any new games have been played and adds them to the localStoage list
async function updateGameList(user) {
  console.log('Attempting to update the local storage game list')
  setUser(user)
  const storedGames = getGames()
  const storedCurrentGames = getCurrentGames()
  let lastGameTime = getLastGameTime(storedGames, storedCurrentGames)
  console.log('last game time found: ' + lastGameTime)
  
  // we'll add one so we will only get new games
  lastGameTime = lastGameTime + 1
  const { games : newGames, currentGames } = await getGamesFromLichess(user, lastGameTime)
  const games = deDupeGames(newGames.concat(storedGames)) 
  setGames(games)
  setCurrentGames(currentGames)

  // everytime game list is updated we will forward missing games to the YOW API
  fowardGamesToYowApi()

  return sortGamesByOpponent(games)
}

function setUser(userToSet) {
  user = userToSet
}

// clear out any  number of games games starting from latest, for dev purposes
function clearGames(numberOfGames = 5) {
  const games = getGames()
  for (let i = 0; i < numberOfGames; i++) {
    games.shift()
  }
  setGames(games)
}

// wipe the entire current game object, used for dev testing
function clearCurrentGames() {
 delete localStorage[user + '_currentGames']
}

// clear the yowApi flag on all the games, used in dev to force the game
// updater to resend all the games to the yowApi
function clearWasForwardedToYowApi() {
  const games = getGames()
  for (const game of games) {
    delete game.wasForwardedToYowApi 
  }
  setGames(games)
}

function getGames(opponent) {
  const storedGamesStr = localStorage[user + '_games'] || '[]'
  const storedGames = JSON.parse(storedGamesStr)
  let games = []
  for (const game of storedGames) {
    if (opponent && game.opponent !== opponent) continue
    game.link = 'https://lichess.org/' + game.id
    
    // cheap hack for now to clean Chessmaster from local game records
    if (game.opponent === 'Chessmaster') game.opponent = 'Wizard'
    games.push(game)
  }

  return games
}

function getColorToPlay(opponent) {
  const opponentGames = getGames(opponent)
  const colorRatio = {black: 0, white: 0}
  for (const game of opponentGames ) {
    colorRatio[game.playedAs] ++
  }
  let colorToPlay = 'random'
  if (opponentGames[0]) {
    if (opponentGames[0].playedAs === 'white') colorToPlay = 'black'
    if (opponentGames[0].playedAs === 'black') colorToPlay = 'white'
    if (colorRatio['white'] > colorRatio['black']) colorToPlay = 'black'
    if (colorRatio['white'] < colorRatio['black']) colorToPlay = 'white'
  }
  console.log(`${opponent} Color Ratio is w:${colorRatio.white} b:${colorRatio.black}`)
  console.log(`Color balancing determines user will play as ${colorToPlay}`)
  return colorToPlay
}

function setGames(games) {
  if (!user) {
    console.error('Cannot set games, no user found')
    return
  }
  
  localStorage[user + '_games'] = JSON.stringify(games)
  // console.log(JSON.parse(localStorage[user + '_games']))
}

function deDupeGames(gamesToDeDupe) {
  const gameMap  = {}
  for (const game of gamesToDeDupe) {
    gameMap[game.id] = game
  }
  return Object.values(gameMap)
}

async function setCurrentGames(games) {
  if (!user) {
    console.error('Cannot set current games, no user found')
    return
  }
  
  const gameMap = {}
  for (const game of games) {
    gameMap[game.id] = game 
  }

  localStorage[user + '_currentGames'] = JSON.stringify(gameMap)
}

function getCurrentGames() {
  // if the string object doesn't exist return an empty object
  return JSON.parse(localStorage[user + '_currentGames'] || '{}')
}

// get the ealriest current game, order not really guarateed due to using an
// obj as the map but should be good enough for our purpose
function getCurrentLatestGame() {
  const gameMap = getCurrentGames()
  const games = Object.values(gameMap)
  return games.reverse()[0]
}

// allows for adding a single game to the current game list, useful for caching
// games just created by the frontend, assumes the opponent is set
function addCurrentGame(game) {
  const gameMap = getCurrentGames()
  gameMap[game.id] = game
  localStorage[user + '_currentGames'] = JSON.stringify(gameMap)
}

// used to clear games from the currentGame cache
function deleteCurrentGame(gameId) {
  const gameMap = getCurrentGames()
  delete gameMap[gameId]
  localStorage[user + '_currentGames'] = JSON.stringify(gameMap)
}

// creates and object keyed by opponent names with each of their games
function sortGamesByOpponent(games) {
  let opponentGames = {}
  for (const game of games.slice().reverse()) {

    // if we haven't mapped this opponent yet
    if ( !opponentGames[game.opponent] ) {
      opponentGames[game.opponent] = {games: [], topFeat: 'lost', score: 0}
    }

    // if this game is a higher player achievement than any game before we will map it here
    // also calculate total score by tallying wins and losses
    if (game.conclusion === 'won') {
      opponentGames[game.opponent].topFeat = 'won'
      opponentGames[game.opponent].score++
    } else if (game.conclusion === 'lost' && opponentGames[game.opponent].score > -5){
      opponentGames[game.opponent].score--
    } else if (game.conclusion === 'draw' && opponentGames[game.opponent].topFeat === 'lost') {
      opponentGames[game.opponent].topFeat = 'draw'
    }
    
    opponentGames[game.opponent].games.push(game)

    // this deletes opponent in gamesByOpponent due to JS object by reference
    delete game.opponent
  }
  return opponentGames
}
// const games = JSON.parse(localStorage['thinktt_games'])
// console.log(sortGamesByOpponent(games))


function getLastGameTime(games, currentGames) {
  let lastGameTime = 0
  for (const game of games) {
    if (game.createdAt > lastGameTime) lastGameTime = game.createdAt
  }
  
  // this is making sure last game time stays previous to any current games
  for (const game of Object.values(currentGames)) {
    if (game.createdAt < lastGameTime) lastGameTime = game.createdAt - 1
  }

  return lastGameTime
}

// Using time from last game we have get all games since that game, this
// function is a mess and should refctored and split up, it's doing way to much
async function getGamesFromLichess(user, lastGameTime) {
  console.log(`Attempting to get all games for ${user} since ${lastGameTime}`)

  const res = await lichessApi.getGames(user, lastGameTime)

  if (!res.ok) {
    console.log('Error getting games:') 
    return {games: [], currentGames: []}
  }

  const gamesNdjson = await res.text()
  const games = [] 
  const abortedGames = []
  const opponentlessGames = []
  const currentGames = []

  
  for (const gameStr of gamesNdjson.split('\n')) {
    
    // last input will be a end of line char or some such, stop the loop
    // to keep things from exploding
    if (!gameStr) break
    
    const {id, createdAt, status, players, winner } = JSON.parse(gameStr)
    
    if (status === 'aborted') {
      // clear aborted game from current games
      deleteCurrentGame(id)
      abortedGames.push(id) 
      continue
    }
    
    let opponent = await getOpponent(id)

    // we were unbale to find a opponent, skip this game and record it
    if (!opponent) {
      opponentlessGames.push(id)
      continue
    }

    // now make sure the opponent has it's proper cmpObj name
    opponent = getProperName(opponent)

    if (status === 'started') {
      currentGames.push({ id, createdAt, status, opponent })
      continue
    }
    
    // This is an actual completed game to be stored in long storage 
    const conclusion = parseGameConclusion(players, winner)
    const playedAs = parsePlayedAs(players)
    games.push({id, createdAt, status, conclusion, opponent, playedAs})
  }


  console.log(games.length, 'valid new games found')
  console.log(opponentlessGames.length, 'opponentless games found')
  console.log(abortedGames.length, 'aborted games found')
  console.log(currentGames.length, 'current games found')
  return { games, currentGames}
}

// parse a simple conlcusion, did user win, lose, or draw?
function parseGameConclusion(players, winner) {
  if (!winner) return 'draw'
  if (players[winner].user.name === 'yeoldwiz') return 'lost'
  return 'won'
}

function parsePlayedAs(players) {
  if (players.white.user.name === 'yeoldwiz') return 'black'
  return 'white'
}

async function getOpponent(id) {
  // first let's try to get the opponent from any game currently being played
  const storedCurrentGames = getCurrentGames()
  let opponent = ''
  if (storedCurrentGames[id]) {
    opponent = storedCurrentGames[id].opponent
  }

  // we don't have an opponent for this game locally, try yowApi
  if (!opponent) {
    opponent = await getOpponentFromYowApi(id)
  }

  // we also didn't find this opponent the yowApi. Last resort let's try
  // checking lichess chat logs
  if (!opponent) {
    opponent = await getOpponentFromChat(id)
  }

  return opponent
}

async function getOpponentFromYowApi(gameId) {
  const res = await yowApi.getGame(gameId)

  if(!res.ok) {
    console.log(`Unable to get game ${gameId} from yowApi`)
    return
  }
  const game = await res.json() 
  return game.opponent
}

async function getOpponentFromChat(gameId) {
  const tokens = JSON.parse(localStorage.tokens)
  
  const res = await fetch(`https://lichess.org/api/board/game/${gameId}/chat`, {    
    headers: {
      'Authorization' : 'Bearer ' + tokens.access_token,
      'Accept': 'application/x-ndjson',
    }
  })
  if (!res.ok) {
    console.log(`Error getting chat logs for ${gameId}`)
    return null
  }
  const chatLines = await res.json()

  // we need to ask them who they want to play
  const wizMessages = chatLines.filter(
    line => line.user === 'yeoldwiz' && line.text.includes('Playing as')
  )

  if (wizMessages.length === 0) {
    console.log(`no opponent found for game ${gameId}`)
    return null
  } 

  const opponent = 
    wizMessages[0].text.match(/Playing as [A-Za-z0-9]*/)[0].replace('Playing as ', '')

  console.log(`${gameId} was played by ${opponent}`)
  return opponent
}


// forward gameIds and opponent names to long term YOW API so we no longer 
// depend on chat messages to remember who the opponents of games are
// this may not be used in the future but will help us record opponent
// currently only stored on local storage
async function fowardGamesToYowApi() {
  const games = getGames()

  let gamesForwarded = []
  let gamesFailedToForward = [] 

  for (const game of games) {
    // first just skip any games that have already been forwarded
    if (game.wasForwardedToYowApi) continue
    
    const { id, opponent } = game
    const gameToSend = {id, user, opponent}
    const res = await yowApi.addGame(gameToSend)
    if (!res.ok) {
      // console.log(`Error forwarding game data for ${id}`)
      // console.log(res)
      gamesFailedToForward.push(game)
      continue
    }
    // const data = await res.json()
    game.wasForwardedToYowApi = true
    gamesForwarded.push(game) 
  }
  
  // console.log(games)
  // console.log(gamesForwarded)
  setGames(games)
  console.log(gamesForwarded.length, 'games forwarded to yowApi')
  console.log(gamesFailedToForward.length, 'games failed to forward to yowApi')
}


function getProperName(opponent) {
  const properNames = {
    'josh age 6': 'Josh6',
    'josh age 7': 'Josh7',
    'josh age 8': 'Josh8',
    'josh age 9': 'Josh9',
    'josh age 12': 'Josh12',
    'nyckid6': 'Josh6',
    'nyckid7': 'Josh7',
    'nyckid8': 'Josh8',
    'nyckid9': 'Josh9',
    'nyckid9': 'Josh9',
    'nyckid12': 'Josh12',
    'jw6':  'Josh6',
    'jw7': 'Josh7',
    'jw8': 'Josh8',
    'jw9': 'Josh9',
    'jw12': 'Josh12',
    // 'wizard': 'Chessmaster',
    'the wizard': 'Wizard',
    'pawnmaster': 'Shakespeare',
    'drawmaster': 'Logan',
  }

  return properNames[opponent.toLowerCase()] || opponent
}

// const opponent = await getWizPlayerFromChat('5ZAXEu4YAk5S')
// console.log(opponent) 
// const games = await getGames('1617328317956')
// localStorage['thinktt_games'] = JSON.stringify(games)

// updateGameList('thinktt')