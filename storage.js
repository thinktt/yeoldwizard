let user = null

export default {
  setUser, 
  setGames,
  setCurrentGames,
  getGames,
  getCurrentGames,
  clearCurrentGames,
  addCurrentGame,
  deleteCurrentGame,
}


function setUser(userToSet) {
  user = userToSet
}

function setGames(games) {
  if (!user) {
    console.error('Cannot set games, no user found')
    return
  }
  
  for (const game of games) {
    if (Array.isArray(game.moves)) game.moves = game.moves.join(' ')
  }

  localStorage[user + '_games'] = JSON.stringify(games)
}

function getGames(opponent) {
  const storedGamesStr = localStorage[user + '_games'] || '[]'
  const storedGames = JSON.parse(storedGamesStr)
  let games = []
  for (const game of storedGames) {
    if (opponent && game.opponent !== opponent) continue
    game.link = 'https://lichess.org/' + game.id
    game.moves = game.moves.split(' ')
  }
  return games
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


// wipe the entire current game object, used for dev testing
function clearCurrentGames() {
  delete localStorage[user + '_currentGames']
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