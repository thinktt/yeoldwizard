export default { 
  getGames,
  getGamesByIds,
  createChallenge,
  getGameStream,
  makeMove,
}

const baseUrl = 'https://lichess.org/api'
const tokens = JSON.parse(localStorage.tokens)
const headers = {
  'Authorization' : 'Bearer ' + tokens.access_token,
  'Accept': 'application/x-ndjson',
}


async function getGames(user, lastGameTime) {
  const lichessEndpoint = `${baseUrl}/games/user/yeoldwiz`
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


async function getGamesByIds(ids) {
  const tokens = JSON.parse(localStorage.tokens)
  const lichessEndpoint = `${baseUrl}/games/export/_ids`
  const res = await fetch(lichessEndpoint, {    
    headers: {
      'Authorization' : 'Bearer ' + tokens.access_token,
      'Accept': 'application/x-ndjson',
    },
    method: 'POST',
    body: ids.toString()
  })
  const data = await res.text()
  const blobs = data.split('\n')
  // remove the end of data blob
  blobs.pop()
  
  const games = blobs.map(blob => JSON.parse(blob))
  return games
}


async function getStream(url, handler, onDone) {
  const controller = new AbortController()
  const signal = controller.signal
  const res = await fetch(baseUrl + url, { method: 'GET', headers, signal })

  console.log(res.status)
  console.log(res.ok)
  console.log(res)


  const onErr = (err) => {
    console.error(chalk.red(`${url} stream error: ${err}`))
    
    if (!controller.signal.aborted) {
      console.error(chalk.red(`${url} aborting stream`))
      controller.abort()
      return 
    }
    // restartStream(url, handler, onDone, onErr)
  }

  const decoder = new TextDecoder()
  let buf = ''

  res.body.on('data', (data) => {
    const chunk = decoder.decode(data, { stream: true })
    buf += chunk
    let parts = buf.split(/\r?\n/)
    buf = parts.pop() 
    for (const part of parts) {
      if (!part) continue
      let event
      try {
        event = JSON.parse(part)
      } catch (err) {
        const jsonErr = `JSON error ${err}`
        onErr(jsonErr)
        continue
      }
      handler(event)
    }
  })

  res.body.on('error', onErr)
  res.body.on('end', onDone)
 
  return { res, controller }
}

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


async function getGameStream(gameId, handler, onDone) {
  const stream = await startStream(`/board/game/stream/${gameId}`, handler, onDone)
  return stream
}


async function createChallenge(colorToPlay) {
  const res = await fetch(`${baseUrl}/challenge/yeoldwiz`, {
    method: 'POST',
    headers: { 
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization' : 'Bearer ' + tokens.access_token
    },
    body: new URLSearchParams({
      rated: false, 
      color: colorToPlay,
    }),
  })

  return res
} 

async function makeMove(gameId, move) {
  const res = await fetch(`${baseUrl}/board/game/${gameId}/move/${move}`, {
    method: 'POST',
    headers: { 
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization' : 'Bearer ' + tokens.access_token
    },
  })

  const data = await res.json() 

  if (!res.ok) {
    let err = Error(`${res.status}`)
    err.res = res 
    throw err    
  }

  return res

  // return post(`api/bot/game/${gameId}/move/${move}`, null, (err) => {
  //   throw err
  // })
}