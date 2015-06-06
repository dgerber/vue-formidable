var Form = require('../')
var examples = require('./examples')

var Vue = require('vue')
Vue.config.debug = true

Vue.component('select-js', require('vue-select-js'))
Vue.component('vf-form', Form)

var demo = new Vue({
  el: '#demo',
  data: {
    examples: examples.map(function(ex){
      return { text: ex.schema.title || ex.schema.description
               || ex.schema.type || JSON.stringify(ex.schema),
               value: ex }
    }),
    example: examples[0]
  }
})

global.demo = module.exports = demo
global.Vue = Vue
global.Form = Form
global.templates = require('../src/templates')
