
// console.log(window.location.search.substr(1))


// const authCodeRegex = /code\=([a-f0-9]*)/
// const match = authCodeRegex.exec(window.location.search.substr(1))
// if (match) {
//   const code = match[1]
//   const query =  `?code=${code}`
//   fetch('http://localhost:5000/token' + query)
//   .then(res => {
//     console.log('Howdy')
//     console.log(res.json)
//     return res.json()
//   })
//   .then(data => {
//     console.log(`token: ${JSON.stringify(data)}`)
//   })
//   .catch(err => {
//     console.log('boo')
//     console.log(err)
//   })
// }

doAccountFlow()

async function doAccountFlow() {
  // first check if this is a Athorization callback
  const authCodeRegex = /code\=([a-f0-9]*)/
  const match = authCodeRegex.exec(window.location.search.substr(1))
  if (match) {
    console.log("Auth callback detected, attempting to fetch tokens")
    const code = match[1]
    const query =  `?code=${code}`
    try {
      let res = await fetch('http://localhost:5000/token' + query)
      console.log(res.status)
      console.log(res.statusText)
      const tokens = await res.json() 
      console.log(tokens)
      
      res = await fetch('https://lichess.org/api/account', {
        headers: {
          'Authorization' : 'Bearer ' + tokens.access_token, 
        }
      }) 
      const account = await res.json()
      console.log(account)
    } catch (err) {
      console.log(err)
    }
  }
  
  startApp()
}


async function startApp() {
  const res = await fetch('personalities.json')
  const cmpsObj = await res.json()
  const cmps = Object.entries(cmpsObj).map(e => e[1]).reverse()

  const app = new Vue({
    el: '#app',
    data: {
      selected: cmpsObj.Chessmaster,
      navIsOn: true,
      isInPlayMode: false,
      groups : [
        {
          title: 'The Wizard',
          high: 3000,
          low: 2701,
          cmps: [],
        }, 
        {
          title: 'The Grandmasters',
          high: 2701,
          low: 2700,
          cmps: [],
          isGms: true,
        }, 
        {
          title: 'The Masters',
          high: 2650,
          low: 2000,
          cmps: [],
        },
        {
          title: 'Club Players',
          high: 2000,
          low: 1500,
          cmps: [],
        },
        {
          title: 'Casual Players',
          high: 1500,
          low: 1000,
          cmps: [],
        },
        {
          title: 'Beginners',
          high: 1000,
          low: 500,
          cmps: [],
        },
        {
          title: 'Noobs',
          high: 500,
          low: 0,
          cmps: [],
        },
      ]
    },
    methods: {
      switchNav(event) {
         this.navIsOn = true
         this.isInPlayMode = false
      },
      selectCmp(cmp) {
        if (!this.isInPlayMode) {
          this.selected = cmpsObj[cmp.name]
          this.navIsOn = false
        }
      },
      togglePlayMode(cmp) {
        this.selected = cmpsObj[cmp.name]
        this.navIsOn = false
        this.isInPlayMode = !this.isInPlayMode
      },
      stopPlayMode(){
        // console.log(isInPlayMode)
        this.isInPlayMode = false
      }
    }
  })

  for (const group of app.groups) {
    group.cmps = getRatingGroup(cmps, group.high, group.low)
  }
}

function getRatingGroup(cmps, high, low) {
  const cmpGroup = cmps.filter(cmp => {
    return (cmp.rating >= low) && (cmp.rating < high) 
  }) 
  return cmpGroup.reverse()
}