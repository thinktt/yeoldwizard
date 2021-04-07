// const yowProxyUrl = 'http://localhost:5000'
const yowProxyUrl = 'https://yowproxy.herokuapp.com'
const oauthUrl = 'https://oauth.lichess.org/oauth/authorize' 
const oauthQuery = '?response_type=code'
const scopeQuery = '&scope=preference:read'

let clientIdQuery, redirectQuery
if (window.location.host == 'localhost:8080') {
  clientIdQuery = '&client_id=L47TqpZn7iaJppGM'
  redirectQuery = '&redirect_uri=http://localhost:8080'
} else {
  clientIdQuery = '&client_id=L9Yucz97TJAgWsGU'
  redirectQuery = '&redirect_uri=https://thinktt.github.io/yeoldwizard/'
}


doAccountFlow()

async function doAccountFlow() {
  if (window.localStorage.user) {
    console.log('User ' + window.localStorage.user + ' found')
    startApp(window.localStorage.user)
    return
  }

  // first check if this is a Athorization callback
  const authCodeRegex = /code\=([a-f0-9]*)/
  const match = authCodeRegex.exec(window.location.search.substr(1))
  if (match) {
    // go ahead and clear the query string as we no longer need it
    window.history.replaceState({}, null, window.location.origin + window.location.pathname)
    
    //null starts the app with knight spining to show it's trying to connect
    const app = await startApp(null)
    
    console.log("Auth callback detected, attempting to fetch tokens")
    const code = match[1]
    const query =  `?code=${code}`
    try {
      let url = yowProxyUrl + '/token' + query
      let res = await fetch(url)
      console.log('response: ', res.status, res.statusText)
      const tokens = await res.json() 
      console.log('Setting tokens is local storage')
      tokens.fetchTime = Math.floor(Date.now() / 1000)
      window.localStorage.tokens = JSON.stringify(tokens)
  
      res = await fetch('https://lichess.org/api/account', {
        headers: {
          'Authorization' : 'Bearer ' + tokens.access_token, 
        }
      }) 
      const account = await res.json()
      console.log('Setting user ' + account.username + 'in local storage')
      localStorage.user = account.username
      app.user = account.username

    } catch (err) {
      console.log(err)
    }
    return     
  }
  
  // startApp with no user starts app in a singed out state
  startApp()
}


async function startApp(user) {
  const res = await fetch('personalities.json')
  const cmpsObj = await res.json()
  const cmps = Object.entries(cmpsObj).map(e => e[1]).reverse()

  const app = new Vue({
    el: '#app',
    data: {
      user: user,
      selected: cmpsObj.Chessmaster,
      navIsOn: true,
      shouldShowSignOut: false,
      isInPlayMode: false,
      signInLink: oauthUrl + oauthQuery + scopeQuery + clientIdQuery + redirectQuery,
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
      },
      toggleSignOut(shouldShow) {
        this.shouldShowSignOut = shouldShow
      },
      signOut() {
        this.user = ""
        window.localStorage.clear()
      }
    }
  })

  for (const group of app.groups) {
    group.cmps = getRatingGroup(cmps, group.high, group.low)
  }

  return app
}

function getRatingGroup(cmps, high, low) {
  const cmpGroup = cmps.filter(cmp => {
    return (cmp.rating >= low) && (cmp.rating < high) 
  }) 
  return cmpGroup.reverse()
}