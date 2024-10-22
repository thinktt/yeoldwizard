export default { 
  checkHealth,
  addGame,
  getGame,
  addUser,
  getUser,
  getGames2,
}

// we'll use this to mark the api as down if we get a refused connection
// maybe not the best solution but will keep reques noise down if we 
// if yowApi is down for now
let yowApiIsDown = false

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

async function getGames2(user, lastGameTime, handler, onDone) {
  const url = `${yowApiUrl}/games2?playerId=${user}&createdAt=${lastGameTime}`

  const eventSource = new EventSource(url)

  eventSource.onmessage = (event) => handler(JSON.parse(event.data))
  eventSource.onerror = (err) => {
    console.log('SSE error:', err.message)
    eventSource.close()
  }
  eventSource.onclose = () => { if (onDone) onDone() }

  return {
    abort: () => eventSource.close()
  }
}

async function addGame(game) {
  if (yowApiIsDown) {
    return apiIsDownRes
  }
  const res = await fetch(`${yowApiUrl}/games/`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(game)
  }).catch((err) =>  {
    yowApiIsDown = true
    return {ok: false, status: 502, message: 'connection refused' }
  })

  return res
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