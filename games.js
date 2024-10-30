import yowApi from './yowApi.js'
import lichessApi from './lichessApi.js'
import db from './storage.js'
const Chess = window.Chess
const chess = new Chess()

export default { 
  setUser,
  loadGames,
  setGames,
  makeGameRow,
  parseGameRow,
  getGames,
  getGamesByOpponent,
  getGamesWithMoves : getGames,
  getOpponentFromChat,
  setNullGameCount,
  getNullGameCount,
  getColorToPlay,
  getCurrentGames,
  getCurrentLatestGame,
  addCurrentGame,
  deleteCurrentGame,
  clearGames,
  clearAllGames,
  clearCurrentGames,
  deDupeGames,
  clearWasForwardedToYowApi,
  getAlgebraMoves,
  getDrawType,
  getOpponent,
  getGameById,
  addFensToGameCache,
  chessjsTest,
  setDemoGames,
  getDemoGame,
  hackDemoOpponetName,
  forwardGamesToYowApi,
  dumbHash,
  compareGames,
}

// window.dumbHash = dumbHash


// module globals
let gameCache = null
let opponentMap = {}
let idMap = {}
let user = ''

function getGamesByOpponent() {
  return opponentMap
}

async function loadGamesOld(loadState) {
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
  let buildQue = 0
  
  const handler =  async (lichessGame) => {
    buildQue ++
    const game = await buildLocalGame(lichessGame)
    loadState.loaded ++
    
    if (game.status === 'aborted') {
      // clear aborted game from current games
      deleteCurrentGame(game.id)
      abortedGames.push(game.id) 
      buildQue --
      return 
    }
    if (!game.opponent) {
      // console.log('oponentless game')
      opponentlessGames.push(game.id)
      buildQue --
      return 
    }
    if (game.status === 'started') {
      currentGames.push(game)
      buildQue --
      return 
    }

    games.push(game)
    buildQue --
  }
  
  let resolve
  const promise = new Promise(r => resolve = r) 
  const onDone = async () => {
    while (buildQue) {
      await new Promise(r => setTimeout(r, 0))
    }
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
    forwardGamesToYowApi()
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
  lastGameTime = 0

  let resolve
  const promise = new Promise(r => resolve = r)
  const newGames = []

  const handler = async (yowGame) => {
    let err 
    const localGame = await yowToLocalGame(yowGame).catch(e => err = e)
    
    newGames.push(localGame)
    if (err) {
      console.error(err) 
    } 
  }

  const oldGames = storedGames

  const onDone = async () => {
    // for (let i =0; i<100; i++) {
    //   await new Promise(r => setTimeout(r, 5))
    //   loadState.loaded ++
    // }

    newGames.sort((a, b) => b.createdAt - a.createdAt)
    
    setGames(newGames)
    // compareGames(oldGames, newGames)
    
    window.oldGames = oldGames
    window.newGames = newGames
    
    loadState.isDone = true
    resolve()
  }
   
  loadState.toGet = 100
  
  yowApi.getGames2(user, lastGameTime, handler, onDone)
  return promise
}

function normalizeGame(game) {
  const normalGame = {}
  
  for (const key of gameKeys) {
    normalGame[key] = game[key]
  } 
  return normalGame
}

function compareGames(oldGames, newGames) {
  // console.log(oldGames)
  const oldGameMap = {}
  oldGames.forEach(game => {
    oldGameMap[game.id] = game
  })
  
  newGames.forEach(game => {
    const oldGame = oldGameMap[game.id]

    if (dumbHash(oldGame) === dumbHash(game)) {
      console.log('good')
    }

    console.log(game.id, dumbHash(oldGame), dumbHash(game))
    // if (dumbHash(oldGame) !== dumbHash(game)) {
    //   console.error('no hash map for ', game.id)
    // }

    if (!oldGame) {
      console.error('No game found for ', game.id)
      return 
    }
    
    const keys = Object.keys(oldGame)
    for (const key of keys) {
      if (key === 'moves') continue

      if (oldGame[key] !== game[key]) {
        console.error(`mismatch in gameId: ${oldGame.id}, key: ${key}`)
        console.log('old: ', oldGame[key], 'new:', game[key])
        console.log(oldGame)
        console.log(game) 
        return 
      }
    }

    const oldMoves = oldGame.moves.toString()
    const newMoves = game.moves.toString()

    if (oldMoves !== newMoves) {
      console.error('moves do not match for ', game.id)
      console.log(oldMoves)
      console.log(newMoves)
      return
    }

    // console.log('compared without error')
  })
  
  console.log(newGames.length)
  console.log(oldGames.length)

}

async function yowToLocalGame(yowGame) {
  const game = {
    id : yowGame.id,
    createdAt: yowGame.createdAt,
    lastMoveAt: yowGame.lastMoveAt,
    moves: yowGame.moves.split(' '),
    wasForwardedToYowApi: true, 
  }
 
  // throw error on matching player types
  if (yowGame.whitePlayer.type === yowGame.blackPlayer.type) {
    throw new Error('invalid local game, players are same type:', yowGame.whitePlayer)
  }

  if (yowGame.whitePlayer.type === 'cmp') {
    game.opponent = yowGame.whitePlayer.id 
    game.playedAs = 'black'
  } else {
    game.opponent = yowGame.blackPlayer.id
    game.playedAs = 'white' 
  }

  switch (yowGame.winner) {
    case 'pending':
      game.status = 'started'
      game.conclusion = null
      break
    case 'draw':
      game.conclusion = 'draw'
      break
    case 'black':
      if (game.playedAs === 'black') game.conclusion = 'won'
        else game.conclusion = 'lost'
      break
    case 'white':
      if (game.playedAs === 'white') game.conclusion = 'won'
        else game.conclusion = 'lost'
      break
    default:
      throw new Error ('no valid yowGame.winner found')
  }

  switch (yowGame.method) {
    case 'mate':
      game.status = 'mate'
      game.drawType = null
      break
    case 'resign':
      game.status = 'resign'
      game.drawType = null
      break
    case 'time':
      game.status = 'outoftime'
      game.drawType = null
      break
    case 'mutual':
      game.status = 'draw'
      game.drawType = 'mutual'
      break
    case 'stalemate':
      game.status = 'stalemate'
      game.drawType =  'stalemate'
      break
    case 'material':
      game.status = 'draw'
      game.drawType = 'material'
      break
    case 'threefold':
      game.status = 'draw'
      game.drawType =  'threefold'
      break
    case 'fiftyMove':
      game.status = 'draw'
      game.drawType = 'fiftyMove'
      break
    case undefined: 
      game.status = 'started'
      game.drawType = null
    default:
      throw new Error ('no valid yowGame.method found')
  }

  const normalGame = normalizeGame(game) 

  return normalGame
}

function setNullGameCount(count) {
  const previousCount = Number(localStorage.nullGamesCount) || 0
  localStorage.nullGamesCount = previousCount + count 
} 

function getNullGameCount() {
  return localStorage.nullGamesCount || 0
}


async function buildLocalGame(game) {
  const {id, createdAt, lastMoveAt, status, players, winner, moves : movesStr } = game

  if (status === 'aborted') {
    return { id, status: 'aborted' }
  }

  let { opponent, opponentSource} = await getOpponent(id)
  let wasForwardedToYowApi
  if (opponentSource === 'yowApi') wasForwardedToYowApi = true 

  if (!opponent) {
    return { id, opponent: null }
  }

  // now make sure the opponent has it's proper cmpObj name
  opponent = getProperName(opponent)
  
  //moves come from lichess as a string, make them an Array
  const moves = movesStr.split(' ')
  const playedAs = parsePlayedAs(players)

  if (status === 'started') {
    return { id, createdAt, lastMoveAt, status, opponent, playedAs, moves }
  }

  // This is an actual completed game to be stored in long storage. This 
  // parsing is very slow especially for getDrawType, need to make non blocking
  const conclusion = parseGameConclusion(players, winner)
  const drawType = getDrawType(conclusion, moves)
  const localGame = {id, createdAt, lastMoveAt, status, conclusion, drawType, opponent, 
    playedAs, moves, wasForwardedToYowApi }
  
  return localGame
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
    console.log('no stored games found for ' + user)
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


function clearAllGames() {
  gameCache = []
  idMap = {}
  opponentMap = {}
  delete localStorage[user + '_gameRows']
}

function setGames(games) {
  if (!user) {
    console.error('Cannot set games, no user found')
    return
  }

  if (games.length === 0) {
    console.log('no games to set')
    return
  }

  // first replace the game cache
  const { gamesByOpponet, gamesById } = sortGames(games)
  gameCache = games
  idMap = gamesById
  opponentMap = gamesByOpponet

  const gameKeys = Object.keys(games[0])
  const gameRows = []

  // turn move arrays into move strings
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


const gameKeys =  ["id","createdAt","lastMoveAt","status","conclusion",
    "drawType","opponent","playedAs","moves","wasForwardedToYowApi"]

function makeGameRow(game) {

  // convert move array to moves string
  const moves = game.moves.join(' ')

  const gameRow = []
  for (const key of gameKeys) {
    if (key === 'moves') {
      gameRow.push(moves)
      continue
    }
    gameRow.push(game[key])     
  }

  return gameRow
}

function parseGameRow(gameRow) {
  const game = {}
  gameKeys.forEach((key, i) => game[key] = gameRow[i])
  game.moves = game.moves.split(' ')

  return game
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
    chess.move(move, { sloppy: true }) 
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
      gamesByOpponet[game.opponent] = {games: [], topFeat: 'lost', score: 0, winCount: 0}
    }

    // if this game is a higher player achievement than any game before we will map it here
    // also calculate total score by tallying wins and losses
    if (game.conclusion === 'won' && gamesByOpponet[game.opponent].score < 5) {
      gamesByOpponet[game.opponent].topFeat = 'won'
      gamesByOpponet[game.opponent].score++
      gamesByOpponet[game.opponent].winCount++
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
  if (!opponent) {
    opponent = await getOpponentFromChat(id)
  }

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


const chatReqQue = []
let queIsstarted = false

async function getOpponentFromChat(gameId) {
  let resolve 
  const reqPromise = new Promise(r => resolve = r)
  chatReqQue.push({gameId, resolve})
  doChatReqs()
  // const opponent  = await lichessApi.getChatOpponent(gameId)
  return reqPromise
}

async function doChatReqs() {
  if (queIsstarted) return
  queIsstarted = true
  while(chatReqQue.length) {
    const { resolve, gameId } = chatReqQue.pop()
    const opponent  = await lichessApi.getChatOpponent(gameId)
    resolve(opponent)
  }
  queIsstarted = false
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
async function forwardGamesToYowApi() {
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
      console.log(`Error forwarding game data for ${id}`)
      console.log(res)
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

  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash &= hash // Convert to 32bit integer
  }
  return new Uint32Array([hash])[0].toString(36)
}

function chessjsTest() {
  const game = games.getGameById('qQTvezgg')
  // .35ms
  const chess = new Chess()
  
  // 49ms
  for (const move of game.moves) {
    chess.move(move)
  }

  //.16ms
  console.log(chess.fen())
  
  //.2ms
  chess.load('5rk1/3r2b1/6R1/1BP1B1N1/1P2P3/5P2/1P3P1P/4K3 w - - 0 34')
  
  console.time('chessjs')
  chess.fen()
  chess.history()
  
  console.timeEnd('chessjs')
}

const demoGames = [
  {
    "id":"dXI5xOQ4",
    "createdAt":1684792432628,
    "lastMoveAt":1684793023692,
    "status":"started",
    "conclusion":"won",
    "drawType":null,
    "opponent":"Cassie",
    "playedAs":"black",
    "moves":["Nf3","e5","h3","e4","Rg1","exf3","gxf3","Bc5","Rg3","Bxf2+","Kxf2","Qh4","e3","Nf6","Kg2","Nh5","Kg1","Qxg3+","Kh1","d6","Na3","Bxh3","Nb5","Bxf1","Qxf1","Nc6","c3","Ne5","e4","Nxf3","Qg2","Qh4+","Qh3","Ng3+","Kg2","Ne1+","Kf2","Nd3+","Kg2","Qxe4+","Kh2","Qf3","Nxc7+","Kf8","Qxg3","Qe2+","Kh3","Nf2+","Kh4","Qe4+","Kh5","Qf5+","Qg5","g6+","Kh6","Qh3+","Qh4","Ng4+","Kg5","f6+","Kf4","Qxh4","Rb1","f5","Nd5","Qf2+","Kg5","Kg7","a3", "h6#"],
    "wasForwardedToYowApi":true, 
    "demoPlayer": "Stanley"
  },
  {
    "id":"nK5NvFyC",
    "createdAt":1674491181604,
    "lastMoveAt":1674495352492,
    "status":"mate",
    "conclusion":"won",
    "drawType":null,
    "opponent":"Stanley",
    "playedAs":"black",
    "moves":["h4","e5","b4","Bxb4","f3","Nc6","h5","h6","c3","Qg5","Kf2","Bc5+","d4","exd4","Bxg5","hxg5","Kg3","d6","e4","Ne5","Be2","g4","Rh3","gxh3","Nxh3","Rxh5","cxd4","Bxd4","Nd2","Nf6","Qb3","Rh6","Ng1","Rg6+","Kh2","Nfg4+","Kg3","Nf2+","Kh4","f6","Qc3","Rh6+","Kg3","g5","Qc6+","Bd7","Nh3","Nxh3","Nc4","Nf4","Ne3","Bxe3","Qxd7+","Kxd7","Bf1","Rh4","Bb5+","c6","Bxc6+","bxc6","a3","Nh5#"],"wasForwardedToYowApi":true,
    "demoPlayer": 'Cassie',
  }
]





let shouldUseDemoGames = false

function getDemoGame(name) {
  const game = demoGames[0]
  game.id = name
  return game
  // game.opponent = name
  // game.id = name + 'DemoGame'
  // return { ...game }
}

function setDemoGames() {
  // shouldUseDemoGames = true
  setUser('demobob')
  setGames(demoGames)
}

function hackDemoOpponetName(name) {
  demoGames[0].opponent = name
  // demoGames[0].id = name + 'DemoGame'
}


function getGameById(id) {
  console.log(id, shouldUseDemoGames)
  if (shouldUseDemoGames) {
    return getDemoGame(id)
  }
  return idMap[id]
}

