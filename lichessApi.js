export default {
  storeToken,
  getSignInLink, 
  getToken,
  getAccount,
  getGames,
  getGames2,
  getGamesCount,
  getGamesByIds,
  createChallenge,
  getGameStream,
  makeMove,
  resign,
  offerDraw,
  abortGame,
  getChatOpponent,
  importGame,
  getAnalysisLink,
}

const clientId = 'yeoldwizard.com'
const redirectUri = 'https://yeoldwizard.com/'


// let dummyCode
// if (window.location.host.includes('192.168')) {
//   console.log('Using dummy account for local dev address')
//   dummyCode = 'EzUA-uZDIDR-E6-8XZgnvVpr0KvYQwWAjiVUk3E7ZoY'
//   window.localStorage.user = 'dummyjoe'
// }
// codeChallenge = dummyCode || await genChallengeCode(localStorage.codeVerifier)

const baseUrl = 'https://lichess.org/api'
let tokens
if (localStorage.tokens) {
  tokens = JSON.parse(localStorage.tokens)
  console.log('token found')
} else {
   console.log('no api tokens found for api')
}

function storeToken(tokenToSet) {
  console.log('Setting and storing Lichess API token')
  tokenToSet.fetchTime = Math.floor(Date.now() / 1000)
  localStorage.tokens = JSON.stringify(tokenToSet)
  tokens = tokenToSet
}

async function getSignInLink(codeVerifier) {
  const oauthUrl = 'https://lichess.org/oauth' 
  const oauthQuery = '?response_type=code'
  const scope = 'board:play'
  // const codeVerifier = localStorage.codeVerifier || genRandomString()
  // localStorage.codeVerifier = codeVerifier
  let dummyCode
  if (window.location.host.includes('192.168')) {
    console.log('using dummy code')
    dummyCode = 'EzUA-uZDIDR-E6-8XZgnvVpr0KvYQwWAjiVUk3E7ZoY'
  }
  const codeChallenge = dummyCode || await genChallengeCode(codeVerifier)

  const signInLink = oauthUrl + oauthQuery + '&scope=' + scope + '&client_id=' + 
    clientId + '&redirect_uri=' + redirectUri + '&code_challenge_method=S256' + 
    '&code_challenge=' + codeChallenge + '&state=12345'
 
    return signInLink
}

async function getToken(code, codeVerifier) {
  // const codeVerifier = localStorage.getItem('codeVerifier')
  console.log('code verifier', codeVerifier)
  const url = 'https://lichess.org/api/token'
  const query =  `?code=${code}&redirect_uri=${redirectUri}`
  const body = {
    grant_type : 'authorization_code',
    code: code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
    client_id: clientId,
  }

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    method: 'POST',
    body: new URLSearchParams(body)
  })

  if (!res.ok) {
    let err = Error(`Token request failed with status ${res.status}`)
    err.res = res 
    throw err    
  }

  const token = await res.json()
  return token
}

async function getAccount() {
  const res = await fetch('https://lichess.org/api/account', {
    headers: {
      'Authorization' : 'Bearer ' + tokens.access_token, 
    }
  }) 
  if (!res.ok) throw res.error

  const account = await res.json()
  return account
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


async function getGames2(user, lastGameTime, handler, onDone) {
  const endpoint = `/games/user/yeoldwiz`
  const query = `?since=${lastGameTime}&vs=${user}&opening=false&rated=false&perfType=correspondence&ongoing=true`
  const stream = await startStream(endpoint + query, handler, onDone)
  return stream
}

async function getGamesCount(user) {
  const lichessEndpoint = `${baseUrl}/crosstable/yeoldwiz/${user}`
  const tokens = JSON.parse(localStorage.tokens)
  const res = await fetch(lichessEndpoint, {    
    headers: {
      'Authorization' : 'Bearer ' + tokens.access_token,
      'Accept': 'application/x-ndjson',
    }
  })
  if (!res.ok) {
    const err = Error(`Resign request failed with status ${res.status}`)
    throw err    
  }
  const data = await res.json()
  return data.nbGames
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
  const tokens = JSON.parse(localStorage.tokens)
  const headers = {
    'Authorization' : 'Bearer ' + tokens.access_token,
    'Accept': 'application/x-ndjson',
  }
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

async function startStream(endpoint, callback, onDone) {
  const tokens = JSON.parse(window.localStorage.tokens)
  const controller = new AbortController()
  const signal = controller.signal
  const headers =  {
    'Authorization' : 'Bearer ' + tokens.access_token,
    'Accept': 'application/x-ndjson',
  }


  const res = await fetch(baseUrl + endpoint, {
    headers,
    signal,
  })
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()

  const doStreamEventLoop = async () => {
    try {
      while (true) {
        if (signal.aborted) {
          console.log('stream was aborted')
          break
        }
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          const outs = value.split('\n')
          for (const out of outs) {
            if (out !== '') callback(JSON.parse(out))
          }
        }
      }
      if (onDone) onDone()
    } catch (err) {
      console.log('from stream:', err.message)
    }
  }

  const abortStream = () => {
    console.log('aborting stream')
    controller.abort()
  }

  const restartStream = () => {
    abortStream()
    console.log('restarting stream')
    return startStream(endpoint, callback, onDone)
  }

  doStreamEventLoop() 
  return { abort: abortStream, restart: restartStream }
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

}

async function post(apiRoute) {
  const res = await fetch(`${baseUrl}${apiRoute}`, {
    method: 'POST',
    headers: { 
      // 'Accept': 'application/json',
      // 'Content-Type': 'application/json',
      'Authorization' : 'Bearer ' + tokens.access_token
    },
  })
  return res
}

async function resign(gameId) {
  let err
  const res = await post(`/board/game/${gameId}/resign`).catch(e => err = e)

  if (err) throw err

  if (!res.ok) {
    const err = Error(`Resign request failed with status ${res.status}`)
    throw err    
  }

  return true
}

async function offerDraw(gameId) {
  let err
  const res = await post(`/board/game/${gameId}/draw/yes`).catch(e => err = e)

  if (err) throw err

  if (!res.ok) {
    const err = Error(`Draw request failed with status ${res.status}`)
    throw err    
  }

  return true
}

async function abortGame(gameId) {
  let err
  const res = await post(`/board/game/${gameId}/abort`).catch(e => err = e)

  if (err) throw err

  if (!res.ok) {
    const err = Error(`Abort request failed with status ${res.status}`)
    throw err    
  }

  return true
}

async function getChatOpponent(gameId) {
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

  console.log(`chat says ${gameId} was played by ${opponent}`)
  return opponent
}

async function importGame(pgn) {
  const body = `pgn=${encodeURIComponent(pgn)}`
  let err
  const res = await fetch(`${baseUrl}/import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Bearer ' + tokens.access_token
    },
    body
  }).catch(e => err = e)

  if (err) throw err

  if (!res.ok) {
    const err = Error(`Import game request failed with status ${res.status}`)
    throw err
  }

  const result = await res.json()
  return result
}

function getAnalysisLink(game) {
  const moveUrlStr = game.moves.join('_')
  const url = 'https://lichess.org/analysis/' + moveUrlStr
  return url
}





//..................Helper Functions...................
function genRandomString() {
  const PKCE_CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const RECOMMENDED_CODE_VERIFIER_LENGTH = 96
  const output = new Uint32Array(RECOMMENDED_CODE_VERIFIER_LENGTH);
  crypto.getRandomValues(output);
  const randStr = base64urlEncode(Array
    .from(output)
    .map((num) => PKCE_CHARSET[num % PKCE_CHARSET.length])
    .join(''));
 
  return randStr
}


async function genChallengeCode(codeVerifier) {
  let codes = crypto
    .subtle
    .digest('SHA-256', (new TextEncoder()).encode(codeVerifier))
    .then((buffer) => {
      let hash = new Uint8Array(buffer);
      let binary = '';
      let hashLength = hash.byteLength;
      for (let i = 0; i < hashLength; i++) {
        binary += String.fromCharCode(hash[i]);
      }
      return binary;
    })
    .then(base64urlEncode)
    .then((codeChallenge) => ({ codeChallenge, codeVerifier }));

  return (await codes).codeChallenge;
}

function base64urlEncode(value) {
  let base64 = btoa(value);
  base64 = base64.replace(/\+/g, '-');
  base64 = base64.replace(/\//g, '_');
  base64 = base64.replace(/=/g, '');
  return base64;
}
