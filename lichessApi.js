export default { 
  getGames,
  getGamesByIds,
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


async function getGamesByIds(ids) {
  const tokens = JSON.parse(localStorage.tokens)
  const lichessEndpoint = `${lichessApiUrl}/games/export/_ids`
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


async function stream(url, handler, onDone) {
  const controller = new AbortController()
  const signal = controller.signal
  const res = await fetch(baseURL + url, { method: 'GET', headers, signal })

  const onErr = (err) => {
    console.error(chalk.red(`${url} stream error: ${err}`))
    
    if (!controller.signal.aborted) {
      console.error(chalk.red(`${url} aborting stream`))
      controller.abort()
      return 
    }
    restartStream(url, handler, onDone, onErr)
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