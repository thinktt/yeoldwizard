import { html } from './pageTools.js'

const template = html`
  <span>
    <p v-if="game.status === 'resign'">
        You
        <span>{{game.conclusion}}</span> 
        by resignation
    </p>
    <p v-else-if="game.status === 'draw' || game.status === 'stalemate'">
        draw by {{game.drawType}}
    </p>
    <p v-else>
      You
      <span> {{game.conclusion}}</span> 
      by {{game.status}}
    </p>
    <a :href="game.link + '/' + game.playedAs" target="_blank" rel="noopener noreferrer">View on Lichess</a>
  </span>
`


export default {
  props: ['game'],
  template,
}