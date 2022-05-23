export default { 
  addGame,
  getGame,
}

// we'll use this to mark the api as down if we get a refused connection
// maybe not the best solution but will keep reques noise down if we 
// if yowApi is down for now
let yowApiIsDown = false

const yowApiUrl = 'http://localhost:5000'
const apiIsDownRes = {ok: false, status: 502, message: 'yowApi is marked as down' }

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