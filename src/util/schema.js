// JSON SCHEMA algebra

/**
 * Walk along allOf
 */
function walkAllOfs(schema, emit){
  emit(schema)
  if (schema.allOf) schema.allOf.forEach(function(s){
    walkAllOfs(s, emit)
  })
}

/**
 * Walk along allOf and combine properties used in forms
 */
exports.combineAll = function combineAll(/*...schemas*/){
  var res = {}
  Array.prototype.concat.apply([], arguments)
    .forEach(function(schema){
      if ('$ref' in schema) console.warn('Schema contains unresolved $ref', schema)
      walkAllOfs(schema, function(s){
        combine(res, s)
      })
    })
  return res
}


function combine(dest/*, ...sources*/){
  if (!dest) dest = {}
  if (!dest.anyOfs) dest.anyOfs = []
  if (!dest.oneOfs) dest.oneOfs = []

  Array.prototype.concat.apply([], Array.prototype.slice.call(arguments, 1))
    .forEach(function(src){
      for (var p in src){
        if (typeof src[p] === 'undefined') continue
        if (p === 'oneOf') dest.oneOfs.push(src.oneOf)
        else if (p === 'anyOf') dest.anyOfs.push(src.anyOf)
        else if (dest[p] === undefined){
          dest[p] = src[p] // deepcopy?
        } else {
          var m = combiners[p]
          if (m) dest[p] = m(dest[p], src[p])
          // else console.debug('No combiner for property ', p)
        }
      }
    })
  return dest
}

var combiners = {
  multipleOf: lcm,

  maximum: Math.min,
  exclusiveMaximum: Math.min,
  minimum: Math.max,
  exclusiveMinimum: Math.max,

  maxLength: Math.min,
  minLength: Math.max,
  pattern: andRegExps,

  maxItems: Math.min,
  minItems: Math.max,
  // TODO: additionalItems and items

  maxProperties: Math.min, minProperties: Math.max,
  required: union,
  // TODO: additionalProperties, properties and patternProperties
  // dependencies

  enum: intersection,
  type: intersection,
  // anyOf, oneOf: hard-coded in combine,
  oneOfs: concat,
  anyOfs: concat
  // not
}

function concat(a, b){
  return a.concat(b)
}

function intersection(a, b){
  if (!Array.isArray(a)) a = [a]
  if (!Array.isArray(b)) b = [b]
  return a.filter(function(y){
    return b.indexOf(y) !== -1
  })
}

function union(a,b){
  var u = {}, p
  for (p in a) u[p] = true
  for (p in b) u[p] = true
  return Object.keys(u)
}

function lcm(a, b){
  return Math.abs(a*b / gcd(a, b))
}

function gcd(a, b){
  return b ? gcd(b, a % b) : a
}

function andRegExps(a,b){
  return '(?='+a+')(?='+b+')'
}



// var jp = require('jsonpatch')
// exports.resolveJSONPointer = function resolveJSONPointer(doc, pointer){
//   console.debug('resolving', pointer, 'in', doc)
//   if (pointer[0] !== '#') throw 'Full URI resolution is not implemented: ' + pointer
//   return (new jp.JSONPointer(pointer.slice(1))).get(doc)
// }
