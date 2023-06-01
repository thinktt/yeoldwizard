import { html } from './pageTools.js'


const template = html`
  <div class="promotion-overlay">
    <!-- <div class="game-done-message">
      <img class="king small" src="images/king-won.png">
      <p>You won by Checkmate</p> 
      <p>
        Your score with Stanley is now 
        <span class="inline-score">+1</span> 
      </p>
      <p>
        Your next goal is to beat Stanly once to win the pawn badge<span  class="pawn-won">♙</span>
      </p> 
      <p>
        Your next goal is get a 
        <span class="inline-score">+2</span>
        score against Stanly to win a trophy point <span  class="inline-trophy">t</span>
      </p>
      <a class="button yellow">ok</a>
    </div> 
    -->
    
    <!-- 
    <div class="game-done-message lost">
      <img class="king small" src="images/king-lost.png">
      <p>You lost by Checkmate</p>
      <p>
        Your score with Stanley is now
        <span class="inline-score down">-1</span> 
        Your score will will never go below 
        <span class="inline-score down">-5</span>
        so you can always recover.
      </p>
      <p>
        Your next goal is to beat Stanly once to win the Pawn Badge<span  class="pawn-won">♙</span>
      </p>
    </div>  
    -->

    <!-- <div class="game-done-message drew">
      <img class="king small" src="images/king-won.png">
      <h2>You won by Checkmate</h2>
      <p> No victory but at least you live to fight another day.</p>
      <p>Draw by Stalemate</p>
      <p>
        YOUR SCORE with Stanley is now <span class="inline-score even">EVEN</span>
      </p>
      <p>
        YOU WON a pawn badge <span  class="pawn-won">♙</span>
        for beating Stanley for the first time
      </p>
      <p>
         NEXT GOAL Beat Stanly to win the Pawn Badge<span  class="pawn-won">♙</span>
      </p>
      <p>
        NEXT GOAL score
        <span class="inline-score">+2</span>
        against Stanly to win a trophy point <span  class="inline-trophy">t</span>
      </p>
      <a class="button yellow">ok</a>
    </div>
    </div>   -->

    <!-- <div class="game-done-message won trophy-win">
      <h2>Congradulation!</h2>
      <p>
        You conqured the Noob group by getting every Trophy Point 
        <span  class="inline-trophy">t</span> <br>
      </p>
      <h2>YOU WON</h2>
      <img src="images/goldenpawn-short.png">
      <h2>The Golden Pawn</h2>
    </div>   -->

    <!-- <div class="game-done-message won trophy-win">
      <p>
        {{score}} <br>
        {{topFeat}} <br>
        {{groupTitle}} <br>
        {{groupTrophy}} <br>
        {{gameConclusion}} <br>
        {{opponent}} <br>
        {{drawType}} <br>

      </p>
    </div> -->
  </div>
`

export default {
  inject: ['score', 'topFeat', 'groupTitle', 'groupTrophy', 'gameConclusion',
    'opponent', 'drawType'], 
  template,
  name: 'WizGameEnd',
}

