export default {
  getVersion
}

const kingHashMap = {
  'f33e751f2b8467193bceee7e480f796b37deeca7259dcc2d420ae395f78de524' : 'D',
  'b2837d3214c7dc0790bc48d25105631bb0aa3c72cc66acffc6b75db964705d2c' : '9',
  '958db8f0e51f3d3648b6a15541c79f0de84765f8829505b19f3100591abd0f41' : '10',
  '40bea41fe03dc9c00a83708bccfbbe45bce28d920eb0fa45900d91c6227f0462' : '11', 
}

// returns a version number if the blob hash is found in the kingHashMap
async function getVersion(blob) {
  // console.log(blob)
  const hash = await getStringHash(blob)
  
  const keys = Object.keys(kingHashMap)

  if (!keys.includes(hash)) {
    console.log('incorrect king hash')
    console.log(hash)
    return
  }
  
  return kingHashMap[hash]
}

async function getStringHash(str) {
  const ab = new TextEncoder().encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', ab)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}