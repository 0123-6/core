import MyTest from './MyTest.js'

debugger

let myVue = Vue.createApp(MyTest)
myVue = myVue.mount('#app')

window.myVue = myVue
