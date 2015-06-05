
exports.merge = function merge(acc){
  for (var i = 1; i<arguments.length; i++){
    var from = arguments[i]
    for (var k in from) acc[k] = from[k]
  }
  return acc
}


if (!Number.isNaN){
  Number.isNaN = function isNaN(value) {
    return typeof value === "number" && value !== value
  }
}

exports.isNot = function isNot(x, y){
  return x !== y && !(Number.isNaN(x) && Number.isNaN(y))
}


var toString = Object.prototype.toString

exports.isPlainObject = function (obj) {
  return toString.call(obj) === '[object Object]'
}


exports.copy = function copy(x){
  return x ? JSON.parse(JSON.stringify(x)) : x
}


var S = "[object String]"

exports.isString = function isString(x){
  return typeof x === 'string' || toString.call(x) === S
}


if (!String.prototype.startsWith){
  String.prototype.startsWith = function(searchString, position){
    position = position || 0
    return this.indexOf(searchString, position) === position
  }
}
if (!String.prototype.endsWith){
  String.prototype.endsWith = function(searchString, position){
    var subjectString = this.toString()
    if (position === undefined || position > subjectString.length){
      position = subjectString.length
    }
    position -= searchString.length
    var lastIndex = subjectString.indexOf(searchString, position)
    return lastIndex !== -1 && lastIndex === position
  }
}


var hop = Object.prototype.hasOwnProperty

exports.unionKeys = function unionKeys(){
  var arg, i, k, l = arguments.length, keys = [], hash = {}
  for (i=0; i<l; i++){
    arg = arguments[i]
    if (!Array.isArray(arg)) arg = Object.keys(arg)
    arg.forEach(addKey)
  }
  function addKey(k){
    if (!hop.call(hash, k)){
      keys.push(k)
      hash[k] = true
    }
  }
  return keys
}
