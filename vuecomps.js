import * as Vue from 'https://cdn.jsdelivr.net/npm/vue@3.2.20/dist/vue.esm-browser.js'
import { loadModule } from 'https://cdn.jsdelivr.net/npm/vue3-sfc-loader@0.8.4/dist/vue3-sfc-loader.esm.js'





// const myComp = await fetch('./myComp.vue').then((res) => res.text())

// console.log(myComp)

const options = {
  moduleCache: { vue: Vue },
  getFile (url) {
    const text = fetch(url).then(res => res.text())
    return text
  }, 
  addStyle: (textContent) => {
    const style = Object.assign(document.createElement('style'), { textContent });
    const ref = document.head.getElementsByTagName('style')[0] || null;
    document.head.insertBefore(style, ref);
  },
}

const myComp = await loadModule('./myComp.vue', options)

window.vu = Vue.createApp({
  data() {
    return { greeting: 'Howdy' }
  }
})

vu.component('my-comp', myComp)
vu.mount('#app')



// const app = Vue.createApp(myComp).mount('#app')

// Vue.createApp(Vue.defineAsyncComponent(() => loadModule('./myComp.vue', options))).mount(document.body);