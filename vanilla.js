console.log('Howdy')

const template = document.querySelector('#myTemplate')
// const clone = template.content.clone(true) 

const myName = 'Joey'

class myGreeting extends HTMLElement {
  constructor() {
    super()
    this.innerHTML = html`<h1>Howdy ${myName}<h1>`
  }
}

function html({ raw }, ...values) {
  console.log(raw)
  console.log(values)
}


customElements.define('my-greeting', myGreeting)
