

const validViews = ['games', 'selected', 'trophies']

let app
let cmpsObj 
let isLocked = false
let lastHash = "#"
function loadApp(appToLoad, cmpsObjToLoad) {
  app = appToLoad
  cmpsObj = cmpsObjToLoad
  console.log('app loaded into history router')
}

function lock() {
  // console.log('locking router')
  isLocked = true
}

function unlock() {
  isLocked = false
}

window.addEventListener('popstate', (event) => {
  if (isLocked) {
    window.location.hash = lastHash 
    return
  }

  // console.log(`location: ${document.location}, state: ${JSON.stringify(event.state)}`);
  const hashRoute = window.location.hash
  lastHash = hashRoute
  const routePieces = hashRoute.slice(1).split('/')
  const view = routePieces[0]
  const item = routePieces[1]
  const cmp = cmpsObj[routePieces[1]]

  // console.log('hash route is:', hashRoute)

  if (view === 'board') {
    app.showBoard(item)
    return
  }

  if (view === 'nav' && !cmp) {
    app.switchNav()
    return
  }

  if (view === 'trophies' && !cmp) {
    app.showTrophies()
    return
  }

  // we're navigating out of nav
  if (!hashRoute && lastHash === '#nav')  {
    app.navIsOn = false
  }

  if (!hashRoute) {
    // console.log('no route')
    app.deselect()
    return
  }

  if (cmp) {
    // console.log(view, cmp.name)
    goToView(view, cmp) 
    return
  }

  console.log(`Could not parse route ${hashRoute}`)
  
})

function route(view, cmpName) {
  if(isLocked) return 

  if (!view) {
    window.location.hash = '#'
    return
  }

  if (view === 'back') {
    back()
    return 
  }

  if (!cmpName) {
    window.location.hash = `#${view}`
    return
  }
  
  window.location.hash = `#${view}/${cmpName}`
}

function back() {
  window.history.back()
}

function goToView(view, cmp) {
  switch(view) { 
    case 'selected': 
      app.select(cmp)
      break
    case 'games': 
      app.select(cmp)
      app.showGames()
      break
    case 'nav':
      app.switchNav()
      break
    case undefined:
      app.deselect(cmp)
      break
}
}


export default {
  loadApp,
  route, 
  lock,
  unlock,
}