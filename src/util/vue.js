var Vue = require('vue')

exports.nextTick = Vue.nextTick

// var yaml = require('js-yaml')
// Vue.filter('yaml', function(x){
//   return yaml.safeDump(x, { flowLevel: 1, skipInvalid: true })
// })

var CircularJSON = require('circular-json')
Vue.filter('json', function(x){
  return CircularJSON.stringify(x, null, 2)
})

exports.fromForm = function fromForm(key, orSchema){
  return function(){
    var t
    return (t = this.form) && t[key] || orSchema && (t = this.schema) && t[key]
  }
}
