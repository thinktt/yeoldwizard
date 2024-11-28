

const config = await getConfig()

async function getConfig() {
  let err
  let res =  await fetch('./config.json').catch(e => err = e)
  if (err) {
    console.log('error fetching config.json:', err)
    return {}
  }
  
  if (!res.ok) {
    console.log('no config.json found: ', res.status) 
    return {}
  }

  const config = await res.json().catch(e => err = e)
  if (err) {
    console.log('error parsing config.json: ', err) 
    return {}
  }

  return config
}

export default config