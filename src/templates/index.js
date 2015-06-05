var fs = require('fs')
var templates = fs.readFileSync(__dirname + '/defaults.html', 'utf8')

// document.write(templates)
var el = document.createElement('template')
el.innerHTML = templates
Array.prototype.forEach.call(
  el.content.querySelectorAll('template,script[type="x-vue"]'),
  function(t){
    if (t.id) exports[t.id] = t
  })


// var css = fs.readFileSync(__dirname + '/styles.css', 'utf8')
// var insertCss = require('insert-css')
// insertCss(css)
