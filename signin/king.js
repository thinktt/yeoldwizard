
const rawKingHashes = [
  '511de09ec25fd8de0a41640c8e53ced4ebab1daeac01a8a9a3116a04f4ed7585',
  'bc4d67847a6c34ce6792e4b0e52e53abba46e71438e1c4e7b22c91122b48e554',
  '9bd6c1b16251e3a462c61c63b4811605a6072fbeb2311ebe7c05842dd0bfc236',
]


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


async function fileToB64(file) { 
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
  })
}

// function that conversts base64 to buffer
function b64ToBuffer(b64) {
  const byteString = atob(b64.split(',')[1])
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
  }
  return ab
}

async function bufferToHash(ab) {
  return await crypto.subtle.digest('SHA-256', ab)
} 

function arrayToBase64String(a) {
  return btoa(String.fromCharCode(...a))
}

function base64StringToArray(s) {
  let asciiString = atob(s)
  return new Uint8Array([...asciiString].map(char => char.charCodeAt(0)))
}

window.king = {
  getVersion,
  rawKingHashes,
  kingHashMap,
  fileToB64,
  b64ToBuffer,
  bufferToHash,
  getStringHash,
  base64StringToArray,
  arrayToBase64String,
}

export default window.king

