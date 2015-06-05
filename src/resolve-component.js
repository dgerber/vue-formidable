
/**
 * Mapping of JSON Schema primitive types to component names
 * */

var T2C = {
  boolean: 'checkbox',
  string: 'text',
  integer: 'number'
  // number: 'number', object: 'object', array: 'array', null: 'null'
}


module.exports = function resolveComponent(schema, form){
  var t

  // TODO: resolver func API?
  if (form && (t = form.type)) return t

  // if (!schema) return undefined

  if ('enum' in schema) return 'vf-select'

  if (schema.oneOf || schema.anyOf || schema.oneOfs || schema.anyOfs ||
      Array.isArray(t = schema.type) || !t) return 'vf-generic'

  t = T2C[t] || t
  if (t) return 'vf-' + t
  console.warn('Invalid JSON Schema type ', t)
}
