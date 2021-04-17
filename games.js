export default { 
  updateGameList, 
}

let yowProxyUrl = 'https://yowproxy.herokuapp.com'

// module globals
let user = ''

function setUser(userToSet) {
  user = userToSet
}

function getGames() {
  const storedGamesStr = localStorage[user + '_games'] || '[]'
  const storedGames = JSON.parse(storedGamesStr)
  return storedGames
}

function setGames(games) {
  if (!user) {
    console.error('Cannot set games, no user found')
    return
  }

  localStorage[user + '_games'] = JSON.stringify(games)
  window.gameList = JSON.parse(localStorage[user + '_games'])
}

// Check is any new games have been played and adds them to the localStoage list
async function updateGameList(user) {
  console.log('Attempting to update the local storage game list')
  
  setUser(user)
  const storedGames = getGames()
  const lastGameTime = getLastGameTime(storedGames) 
  console.log('last game time found: ' + lastGameTime)
  const newGames = await getGamesFromLichess(user, lastGameTime) || []
  const games = newGames.concat(storedGames) 
  setGames(games)
  return sortGamesByOpponent(games)
}

// creates and object keyed by opponent names with each of their games
function sortGamesByOpponent(games) {
  let opponentGames = {}
  for (const game of games) {

    // if we haven't mapped this opponent yet
    if ( !opponentGames[game.opponent] ) {
      opponentGames[game.opponent] = {games: [], topFeat: 'lost'}
    }

    // if this game is a higher player achievement than any game before we will map it here
    if (game.conclusion === 'won') {
      opponentGames[game.opponent].topFeat = 'won'
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


function getLastGameTime(games) {
  let lastGameTime = 0
  for (const game of games) {
    if (game.createdAt > lastGameTime) lastGameTime = game.createdAt
  }
  return lastGameTime
}

// Using time from last game we have get all games since that game
async function getGamesFromLichess(user, lastGameTime) {
  console.log(`Attempting to get all games for ${user} since ${lastGameTime}`)

  const lichessEndpoint = 'https://lichess.org/api/games/user/yeoldwiz'
  const query = `?since=${lastGameTime}&vs=${user}&opening=false&rated=false&perfType=correspondence`
  const tokens = JSON.parse(window.localStorage.tokens)
  const res = await fetch(lichessEndpoint + query, {    
    headers: {
      'Authorization' : 'Bearer ' + tokens.access_token,
      'Accept': 'application/x-ndjson',
    }
  })

  if (!res.ok) {
    console.log('Error getting games:') 
    return null
  }

  const gamesNdjson = await res.text()
  // const games = gamesNdjson.split('\n')
  const games = [] 
  const abortedGames = []
  const opponentlessGames = []
  for (const gameStr of gamesNdjson.split('\n')) {
    if (!gameStr) break
    // const game = JSON.parse(gameStr)
    // games.push(game) 
    const {id, createdAt, status, players, winner } = JSON.parse(gameStr)
    
    // none of these games should be aborted but if one is it should be ignored
    if (status === 'aborted') {
       abortedGames.push(id) 
       continue
    }
    let opponent = await getOpponentFromChat(id)
    if (!opponent) {
      opponentlessGames.push(id)
      continue
    }

    // Make sure the opponent has it's proper cmpObj name
    opponent = getProperName(opponent)
        
    const conclusion = parseGameConclusion(players, winner)
    games.push({id, createdAt, conclusion, opponent})
  }


  console.log(games.length, 'valid new games found')
  console.log(opponentlessGames.length, 'opponentless games found')
  console.log(abortedGames.length, 'aborted games found')
  return games
}

// parse a simple conlcusion, did user win, lose, or draw?
function parseGameConclusion(players, winner) {
  if (!winner) return 'draw'
  if (players[winner].user.name === 'yeoldwiz') return 'lost'
  return 'won'
}

// Check the spectator chat (via HTML page) for a Wiz Player setting
async function getOpponentFromChat(gameId) {
  const req = await fetch(`${yowProxyUrl}/games/${gameId}`)
  
  if (!req.ok) {
    console.log(`Failed to fetch lichess game ${gameId} with status ${req.status}`)
    console.log(`Error: ${req.statusText}`)
    return null
  }

  const gamePage = await req.text()
 
  // caputre and count messagse, if no messages have been sent respond with string
  // no opponent was set for this game
  const wizMessagesRx = /"u":"yeoldwiz","t":".*?"/g
  const wizMessages = gamePage.match(wizMessagesRx) || []
  if (wizMessages.length === 0) {
    return null
  }
  
  // Next we check for a "Playing as string" if one exist we will capture it
  // and try to parse out the opponent name and return it
  const playingAsRx = /"u":"yeoldwiz","t":"Playing as [A-Za-z0-9\.]*/g
  const opponentData = gamePage.match(playingAsRx)
  let opponent = ''
  if (opponentData == null) {
    return null
  }
  opponent = opponentData[0].replace('"u":"yeoldwiz","t":"Playing as ', '')
  return opponent
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
    'wizard': 'Chessmaster',
    'the wizard': 'Chessmaster',
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