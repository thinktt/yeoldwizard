export default { 
  getGames
}

const lichessApiUrl = 'https://lichess.org/api'

async function getGames(user, lastGameTime) {
  const lichessEndpoint = `${lichessApiUrl}/games/user/yeoldwiz`
  const query = `?since=${lastGameTime}&vs=${user}&opening=false&rated=false&perfType=correspondence&ongoing=true`
  const tokens = JSON.parse(localStorage.tokens)
  const res = await fetch(lichessEndpoint + query, {    
    headers: {
      'Authorization' : 'Bearer ' + tokens.access_token,
      'Accept': 'application/x-ndjson',
    }
  })
  return res
}


