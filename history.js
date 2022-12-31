

const validViews = ['games', 'selected']

let app
let cmpsObj 
function loadApp(appToLoad, cmpsObjToLoad) {
  app = appToLoad
  cmpsObj = cmpsObjToLoad
  console.log('app loaded into history router')
}

window.addEventListener('popstate', (event) => {
  // console.log(`location: ${document.location}, state: ${JSON.stringify(event.state)}`);
  const hashRoute = window.location.hash
  const routePieces = hashRoute.slice(1).split('/')
  const cmp = cmpsObj[routePieces[0]]
  const view = routePieces[1]
  
  if (!hashRoute) {
    console.log('no route')
    app.deselect()
    return
  }

  if (cmp) {
    console.log(view, cmp.name)
    goToView(view, cmp) 
    return
  }

  console.log(`Could not parse route ${hashRoute}`)
  
})

function goToView(view, cmp) {
  switch(view) { 
    case 'selected': 
      app.select(cmp)
      break
      case 'games': 
        app.select(cmp)
        app.showGames()
        break
      case undefined:
        app.deselect(cmp)
        break
  }
}






export default {
  loadApp,
}