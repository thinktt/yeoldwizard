export default { getSound, play }

function getSound(url) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)()

  return fetch(url)
    .then(res => res.arrayBuffer())
    .then(data => audioCtx.decodeAudioData(data))
    .then(buffer => ({
      play: () => {
        const source = audioCtx.createBufferSource()
        source.buffer = buffer
        source.connect(audioCtx.destination)
        source.start(0)
      },
    }))
    .catch(err => {
      console.error('Error loading sound:', err)
      return null
    })
}


const move = await getSound('sounds/Move.mp3')
const capture = await getSound('sounds/Capture.mp3')

const sounds = { move, capture }

function play(soundKey) {
  sounds[soundKey].play() 
}