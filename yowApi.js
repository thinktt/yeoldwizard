export default { 
  checkHealth,
  getToken,
  addGame,
  streamGameEvents,
  setDrawOffer,
  clearDrawOffer,
  resign,
  abort,
  addUser,
  getUser,
  getGames2,
  getGame,
}

// we'll use this to mark the api as down if we get a refused connection
// maybe not the best solution but will keep reques noise down if we 
// if yowApi is down for now
let yowApiIsDown = false

let token
let tokenClaims 
let lichessToken

// const yowApiUrl = 'http://localhost:64355'
// const yowApiUrl = 'https://yeoldwiz.duckdns.org:64355'
const yowApiUrl  = 'https://localhost:8443'
// const yowApiUrl = 'https://api.yeoldwizard.com:64355'
const apiIsDownRes = {ok: false, status: 502, message: 'yowApi is marked as down' }

async function checkHealth() {
  const res = await fetch(`${yowApiUrl}/health`, {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    }
  }).catch((err) => {
    return {ok: false, status: 502, message: 'connection refused' }
  })

  return res
}

async function addGame(game) {
  const headers = await getHeaders()
  const res = await fetch(`${yowApiUrl}/games2`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(game)
  })

  const data = await res.json()

  if (!res.ok) {
    const err = Error(`failied to add game with status ${res.status}: ${data.error}`)
    throw err    
  }

  return data
}

async function streamGameEvents(gameIds, eventHandler, doneHandler, errHandler) {
  const url = `${yowApiUrl}/streams/${gameIds}`
  const eventSource = new EventSource(url)

  eventSource.addEventListener("gameUpdate", (event) => {
    eventHandler(JSON.parse(event.data))
  })
  
  eventSource.addEventListener("done", () => {
    eventSource.close()
    if (doneHandler) doneHandler()
  })

  eventSource.onerror = (err) => {
    // console.log('SSE error:', err)
    eventSource.close()
   if (errHandler) errHandler(err)
  }

  return {
    abort() {
      console.log(`client closing game streams for ${gameIds}`)
      eventSource.close()
    }  
  }
}



async function setDrawOffer(gameId, color) {
  const headers = await getHeaders()
  const res = await fetch(`${yowApiUrl}/games2/${gameId}/${color}/draw`, {
    method: 'POST',
    headers: headers
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(`Failed to set draw offe. Status ${res.status}: ${data.error}`)
  }

  return data
}

async function clearDrawOffer(gameId, color) {
  const headers = await getHeaders()
  const res = await fetch(`${yowApiUrl}/games2/${gameId}/${color}/draw`, {
    method: 'DELETE',
    headers: headers
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(`Failed to clear draw offer: status ${res.status}: ${data.error}`)
  }

  return data
}

async function resign(gameId, color) {
  const headers = await getHeaders()
  const res = await fetch(`${yowApiUrl}/games2/${gameId}/${color}/resign`, {
    method: 'POST',
    headers: headers
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(`Failed to resign with status ${res.status}: ${data.error}`)
  }

  return data
}

async function abort(gameId, color) {
  const headers = await getHeaders()
  const res = await fetch(`${yowApiUrl}/games2/${gameId}/${color}/abort`, {
    method: 'POST',
    headers: headers
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(`Failed to abort with status ${res.status}: ${data.error}`)
  }

  return data
}

async function getGame(id) {
  if (yowApiIsDown) {
    return apiIsDownRes
  }
  const res = await fetch(`${yowApiUrl}/games/${id}`, {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
  }).catch((err) => {
    yowApiIsDown = true
    return {ok: false, status: 502, message: 'connection refused' }
  })

  return res
}

async function addUser(user) {
  user.id = user.id.toLowerCase()
  const res = await fetch(`${yowApiUrl}/users/`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },    
    body: JSON.stringify(user)
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(`${res.status}: ${data.message || data.error}`)
  }

  return data
}

async function getUser(id) {
  const lowerId = id.toLowerCase()
  const res = await fetch(`${yowApiUrl}/users/${lowerId}`, {
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },    
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(`${res.status}: ${data.message || data.error}`)
  }

  return data
}

async function updateToken() {
  
  // first get and cache the lichess token from local storage
  if (!lichessToken) {
    const tokenData = JSON.parse(localStorage.getItem('tokens')) 
    lichessToken = tokenData.access_token
  }
 
  const res = await fetch(`${yowApiUrl}/token`, {
    headers: {
      'Authorization': `Bearer ${lichessToken}`,
      'Accept': 'application/json, text/plain, */*'
    }
  }).catch((err) => {
    console.log('Token exchange error:', err)
    return null
  })

  if (!res.ok) {
    throw new Error(`Error fectching token: ${res.status}`)
  }

  const data = await res.json()
  token = data.token
  tokenClaims = data.claims
}

async function getGames2(user, lastGameTime, gameHandler, doneHandler) {
  const url = `${yowApiUrl}/games2?playerId=${user}&createdAt=${lastGameTime}`

  const eventSource = new EventSource(url)

  eventSource.onmessage = (event) => {
    gameHandler(JSON.parse(event.data))
  }

  eventSource.addEventListener("done", (event) => {
    eventSource.close()
    if (doneHandler) doneHandler()
  })

  eventSource.onerror = (err) => {
    console.log('SSE error:', err)
    eventSource.close()
  }

  return {
    abort: () => eventSource.close()
  }
}


async function getToken() {
  const unixTime = Math.floor(Date.now() / 1000)
  
  // the token is already cahced and not expired
  if (token && tokenClaims.exp > unixTime) {
    return token 
  }

  console.log('renewing yow token')
  await updateToken()
  return token 
}

async function getHeaders() {
  const token = await getToken()
  return {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}




// async function addGame(game) {
//   if (yowApiIsDown) {
//     return apiIsDownRes
//   }
//   const res = await fetch(`${yowApiUrl}/games/`, {
//     method: 'POST',
//     headers: {
//       'Accept': 'application/json, text/plain, */*',
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify(game)
//   }).catch((err) =>  {
//     yowApiIsDown = true
//     return {ok: false, status: 502, message: 'connection refused' }
//   })

//   return res
// } 
