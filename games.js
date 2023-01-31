import yowApi from './yowApi.js'
import lichessApi from './lichessApi.js'
import db from './storage.js'
const Chess = window.Chess
const chess = new Chess()

export default { 
  setUser,
  updateGameList,
  loadGames,
  setGames,
  getGames,
  getGamesByOpponent,
  getGamesWithMoves : getGames,
  setNullGameCount,
  getNullGameCount,
  getColorToPlay,
  getCurrentGames,
  getCurrentLatestGame,
  addCurrentGame,
  deleteCurrentGame,
  clearGames,
  clearCurrentGames,
  deDupeGames,
  clearWasForwardedToYowApi,
  getAlgebraMoves,
  getDrawType,
  getOpponent,
  getGameById,
  addFensToGameCache,
}

window.dumbHash = dumbHash

// module globals
let gameCache = null
let opponentMap = {}
let idMap = {}
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
  const { games : newGames, currentGames } = await buildGamesFromLichess(user, lastGameTime)

  const games = deDupeGames(newGames.concat(storedGames)) 
  setGames(games)
  setCurrentGames(currentGames)
  
  // everytime game list is updated we will forward missing games to the YOW API
  fowardGamesToYowApi()
  return opponentMap
}


function getGamesByOpponent() {
  return opponentMap
}


async function loadGames(loadState) {
  if (!user) {
    console.error('No user set, must load user before loading games')
    return
  }

  console.log('Attempting to update the local storage game list')
  const storedGames = getGames()
  const storedCurrentGames = getCurrentGames()
  let lastGameTime = getLastGameTime(storedGames, storedCurrentGames)
  console.log('last game time found: ' + lastGameTime)
  
  // we'll add one so we will only get new games
  lastGameTime = lastGameTime + 1

  const games = [] 
  const abortedGames = []
  const opponentlessGames = []
  const currentGames = []
  
  const handler =  async (lichessGame) => {
    const game = await buildLocalGame(lichessGame)
    loadState.loaded ++
    
    if (game.status === 'aborted') {
      // clear aborted game from current games
      deleteCurrentGame(game.id)
      abortedGames.push(game.id) 
      return 
    }
    if (!game.opponent) {
      // console.log('oponentless game')
      opponentlessGames.push(game.id)
      return 
    }
    if (game.status === 'started') {
      currentGames.push(game)
      return 
    }

    games.push(game)
  }
  
  let resolve
  const promise = new Promise(r => resolve = r) 
  const onDone = () => {
    console.log(games.length, 'valid new games found')
    console.log(opponentlessGames.length, 'opponentless games found')
    console.log(abortedGames.length, 'aborted games found')
    console.log(currentGames.length, 'current games found')
    let sortedGames = games.sort((g0, g1) => g1.createdAt - g0.createdAt)
    const gamesToStore = deDupeGames(sortedGames.concat(storedGames)) 
    setGames(gamesToStore)
    setCurrentGames(currentGames)
    setNullGameCount(abortedGames.length + opponentlessGames.length)
    
    // everytime game list is updated we will forward missing games to the YOW API
    fowardGamesToYowApi()
    loadState.isDone = true
    resolve()
  }

  // loadState.nullGameCount = getNullGameCount()
  loadState.found = storedGames.length
  loadState.total = await lichessApi.getGamesCount(user)
  loadState.toGet = loadState.total - loadState.found - loadState.nullGameCount
  lichessApi.getGames2(user, lastGameTime, handler, onDone)
  return promise
}


function setNullGameCount(count) {
  const previousCount = Number(localStorage.nullGamesCount) || 0
  localStorage.nullGamesCount = previousCount + count 
} 

function getNullGameCount() {
  return localStorage.nullGamesCount || 0
}


window.abortCount = 0
async function buildLocalGame(game) {
  const {id, createdAt, lastMoveAt, status, players, winner, moves : movesStr } = game

  if (status === 'aborted') {
    window.abortCount ++
    return { id, status: 'aborted' }
  }

  let { opponent, opponentSource} = await getOpponent(id)
  let wasForwardedToYowApi
  if (opponentSource = 'yowApi') wasForwardedToYowApi = true 

  if (!opponent) {
    return { id, opponent: null }
  }

  // now make sure the opponent has it's proper cmpObj name
  opponent = getProperName(opponent)
  
  //moves come from lichess as a string, make them an Array
  const moves = movesStr.split(' ')

  if (status === 'started') {
    return { id, createdAt, lastMoveAt, status, opponent, moves }
  }

  // This is an actual completed game to be stored in long storage. This 
  // parsing is very slow especially for getDrawType, need to make non blocking
  const conclusion = parseGameConclusion(players, winner)
  const playedAs = parsePlayedAs(players)
  const drawType = getDrawType(conclusion, moves)
  const localGame = {id, createdAt, lastMoveAt, status, conclusion, drawType, opponent, 
    playedAs, moves, wasForwardedToYowApi }
  
  return localGame
}


// Using time from last game we have get all games since that game, then
// build our game objects that will be stored in the local db
async function buildGamesFromLichess(user, lastGameTime) {
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
    
    const {id, createdAt, lastMoveAt, status, players, winner, moves : movesStr } = 
      JSON.parse(gameStr)
    
    if (status === 'aborted') {
      // clear aborted game from current games
      deleteCurrentGame(id)
      abortedGames.push(id) 
      continue
    }
    
    let { opponent } = await getOpponent(id)

    // we were unbale to find a opponent, skip this game and record it
    if (!opponent) {
      opponentlessGames.push(id)
      continue
    }

    // now make sure the opponent has it's proper cmpObj name
    opponent = getProperName(opponent)

    //moves come from lichess as a string, make them an Array
    const moves = movesStr.split(' ')

    if (status === 'started') {
      currentGames.push({ id, createdAt, lastMoveAt, status, opponent, moves })
      continue
    }
    
    // This is an actual completed game to be stored in long storage. This 
    // parsing is very slow especially for getDrawType, need to make non blocking
    const conclusion = parseGameConclusion(players, winner)
    const playedAs = parsePlayedAs(players)
    const drawType = getDrawType(conclusion, moves)
    games.push({id, createdAt, lastMoveAt, status, conclusion, drawType, opponent, playedAs, moves})
  }


  console.log(games.length, 'valid new games found')
  console.log(opponentlessGames.length, 'opponentless games found')
  console.log(abortedGames.length, 'aborted games found')
  console.log(currentGames.length, 'current games found')
  return { games, currentGames}
}



function getGames(opponent) {
  if (opponent && opponentMap) {
    // console.log('gameMap found returning games from the map')
    return opponentMap[opponent] ? opponentMap[opponent].games : []
  }
  if (!opponent && gameCache) {
  // if (gameCache) { 
    //  console.log('gameCache found, returning all games')
    return gameCache
  }
  if (!localStorage[user + '_gameRows']) { 
    console.log('no stored games found for' + user)
    return []
  }

  console.log('loading previous games from localStorage')
  const gameKeys = JSON.parse(localStorage.gameKeys)
  const gameRowsStr = localStorage[user + '_gameRows']
  const gameRows = JSON.parse(gameRowsStr)

  let games = []
  for (const gameRow of gameRows) {

    //create a game object from the game row
    const game = {} 
    gameKeys.forEach((key, i) => game[key] = gameRow[i])

    if (opponent && game.opponent !== opponent) continue
    game.moves = game.moves.split(' ')
    games.push(game)
  }
  gameCache = games
  return games
}

function getGameById(id) {
  return idMap[id]
}

function setGames(games) {
  if (!user) {
    console.error('Cannot set games, no user found')
    return
  }

  // first replace the game cache
  const { gamesByOpponet, gamesById } = sortGames(games)
  gameCache = games
  idMap = gamesById
  opponentMap = gamesByOpponet

  const gameKeys = Object.keys(games[0])
  const gameRows = []

  for(const game of games) {
    let moves
    moves = game.moves.join(' ')
    const gameRow = Object.values({ ...game, moves })
    gameRows.push(gameRow)
  }
  
  localStorage.gameKeys = JSON.stringify(gameKeys)
  const gameRowsStr = JSON.stringify(gameRows)
  localStorage[user + '_gameRows'] = gameRowsStr
  const hash = dumbHash(gameRowsStr)
  console.log('dbhash:', hash)
  return hash
}


function setUser(userToSet) {
  user = userToSet
  db.setUser(userToSet)
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

function getDrawType(conclusion, moves) {
  if (conclusion !== 'draw') return null
  const chess = new Chess() 
  for (const move of moves) {
    chess.move(move) 
  }
  if (chess.insufficient_material()) return "material"
  if (chess.in_stalemate()) return "stalemate"
  if (chess.in_threefold_repetition()) return "threefold"
  if (chess.in_draw()) return "fiftyMove"
  return "mutual"
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

// sorts games by opponent adding metadata, and creates a map obj of games by id
function sortGames(games) {
  const gamesByOpponet = {}
  const gamesById = {}

  for (const game of games.slice().reverse()) {
    gamesById[game.id] = game
    
    // if we haven't mapped this opponent yet
    if ( !gamesByOpponet[game.opponent] ) {
      gamesByOpponet[game.opponent] = {games: [], topFeat: 'lost', score: 0}
    }

    // if this game is a higher player achievement than any game before we will map it here
    // also calculate total score by tallying wins and losses
    if (game.conclusion === 'won' && gamesByOpponet[game.opponent].score < 5) {
      gamesByOpponet[game.opponent].topFeat = 'won'
      gamesByOpponet[game.opponent].score++
    } else if (game.conclusion === 'lost' && gamesByOpponet[game.opponent].score > -5){
      gamesByOpponet[game.opponent].score--
    } else if (game.conclusion === 'draw' && gamesByOpponet[game.opponent].topFeat === 'lost') {
      gamesByOpponet[game.opponent].topFeat = 'draw'
    }
    gamesByOpponet[game.opponent].games.unshift(game)
  }

  // find and mark game groups where the oppoent is a "Nemesis", meaning you've
  // tried playing them a lot but can't get a positive score on them
  for (const opponent in gamesByOpponet) {
    const numberOfGames = gamesByOpponet[opponent].games.length
    const score = gamesByOpponet[opponent].score
    if(score < -2 && numberOfGames > 10) gamesByOpponet[opponent].isNemesis = true
      else gamesByOpponet[opponent].isNemesis = false
  }
  return { gamesByOpponet, gamesById }
}


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
  let opponentSource = ''
  if (storedCurrentGames[id]) {
    opponent = storedCurrentGames[id].opponent
  }

  // we don't have an opponent for this game locally, try yowApi
  if (!opponent) {
    opponent = await getOpponentFromYowApi(id)
    opponentSource = 'yowApi'
  }

  // we also didn't find this opponent the yowApi. Last resort let's try
  // checking lichess chat logs
  // if (!opponent) {
  //   opponent = await getOpponentFromChat(id)
  // }

  return { opponent, opponentSource }
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


// forward gameIds and opponent names to long term YOW API so we no longer 
// depend on chat messages to remember who the opponents of games are
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

function getAlgebraMoves(cordinateMovesString) {
  chess.reset()
  const cordinateMoves = cordinateMovesString.split(' ')
  for (const move of cordinateMoves) {
    chess.move(move, { sloppy: true })
  }
  return chess.history()
} 

// this is going to be super slow and blocky
function addFensToGameCache() {
  for (const game of gameCache) {
    game.endFen = getFenFromMoves(game.moves)
  }
}

// warning this is really slow
function getFenFromMoves(moves) {
  chess.reset()
  for (const move of moves) {
    chess.move(move)
  }
  return chess.fen()
}

function dumbHash (itemToHash) {
  let str
  if (typeof(itemToHash) === 'object') str = JSON.stringify(itemToHash)
    else str = itemToHash

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32bit integer
  }
  return new Uint32Array([hash])[0].toString(36);
};

// const opponent = await getWizPlayerFromChat('5ZAXEu4YAk5S')
// console.log(opponent) 
// const games = await getGames('1617328317956')
// localStorage['thinktt_games'] = JSON.stringify(games)

// updateGameList('thinktt')