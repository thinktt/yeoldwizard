    {
      async loadUserGames() {
        games.setUser(window.localStorage.user)
        await games.loadGames(this.loadState)
        this.games = games.getGamesByOpponent()
        const currentGame =  await games.getCurrentLatestGame() || {}
        if (currentGame.id) {
          // this.route('selected', currentGame.opponent)
          this.currentGameId = currentGame.id
          this.currentGame = currentGame
          await this.connectToStream(currentGame.id)
          return
        } 
        this.currentGameId = null
      },
      async connectToStream(gameId) {
        const boardGame = this.currentGame //games.getCurrentLatestGame() || {}
        console.log(`Attempting to stream ${boardGame.id}`)
        
        let resolve
        const startPromise = new Promise(r => resolve = r)
        this.currentGame.stream = await lichessApi.getGameStream(boardGame.id, async (event) => {
          switch(event.type) {
            case 'gameFull': 
              console.log(`Succefully connected to Game:`)
              console.log(event.id, event.createdAt, event.state.status) 
              
              boardGame.moves = event.state.moves ? event.state.moves.split(' ') : []
              if (event.white.id == this.user) { 
                boardGame.playedAs = 'white'
              } else {
                boardGame.playedAs = 'black'
              }
              await this.loadBoard(boardGame)
              this.currentGame.lastEventTime = Date.now()
              resolve()
              break;
            case 'gameState':
              this.currentGame.lastEventTime = Date.now()
              this.currentGame.moves = event.moves.split(' ')
              if (this.boardGame.id === this.currentGame.id) {
                this.boardGame.move = this.currentGame.moves
              }
                // this.currentGame = this.boardGame
              if (event.status === 'aborted') {
                this.route('back')
                this.messageType = 'none'
                this.loadUserGames()
                return
              }
             const endStates = ['mate', 'resign', 'stalemate', 'aborted', 'draw']
             if (endStates.includes(event.status)) {
                // console.log(event)
                console.log('Game ended!')
                // this.messageType = 'ended'
                // this.message = `You have completed your game with ${this.selected.name}`
              
                // a hacky way to update the board game status in real time
                // need to create a better state flow from games module
                if (event.status !== 'aborted') this.boardGame.hasJustEnded = true
                this.boardGame.status = event.status
                this.boardGame.lastMoveAt = Date.now()
                if (event.status === 'draw' || event.status === 'stalemate') { 
                  this.boardGame.conclusion = 'draw'
                  this.boardGame.drawType = games.getDrawType(this.boardGame.conclusion, this.boardGame.moves)
                } else if (this.boardGame.playedAs === event.winner) {
                  this.boardGame.conclusion = 'won'
                } else {
                  this.boardGame.conclusion = 'lost'
                }
                
                this.loadUserGames()
              }
              break;
            case 'chatLine': 
              if (event.username === 'lichess' && event.text.includes('declines draw') ) {
                this.drawOfferState = 'declined'
              }
              break;
            default: 
              console.log('unhandled game event: ' +  event.type)
              console.log(event)
          } 
        }, () => {
          console.log(`game stream ${boardGame.id} has ended`)
        })

        return startPromise
      },
    }