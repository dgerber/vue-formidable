var templates = require('../templates')
var base = require('./base-mixin')
var _ = require('../util')

// 5.4. Validation keywords for objects
// maxProperties minProperties required
// additionalProperties, properties, patternProperties
// dependencies


exports['vf-object'] = {

  template: templates.object,

  mixins: [base],

  data: function(){
    return { subfields: [] }
  },

  computed: {

    minProperties: function(){
      return this.schema.minProperties || 0
    },
    maxProperties: function(){
      return this.schema.maxProperties || Infinity
    },

    valueKeys: function(){
      return Object.keys(this.value)
    }

  },

  methods: {

    castValue: function(x){
      return _.isPlainObject(x) ? x : getDefault(this.schema)
    },

    hasProp: function(key){
      return this.value.hasOwnProperty(key)
    },
    addProp: function(key){
      if (key === null){
        key = prompt('Add a property named:')
      }
      if (key !== null){
        // FIXME: support vue-reserved keys ($_)
        this.value.$add(key)
      }
    },
    deleteProp: function(key){
      this.value.$delete(key)
    },
    toggleProp: function(key){
      if (this.hasProp(key)) this.deleteProp(key)
      else this.addProp(key)
    },

    updateSubfields: function(){
      this.subfields = getSubfields(this.schema, this.form, this.value)
    }

  },

  watch: {

    valueKeys: function(){
      this.updateSubfields()
    }

  },


  events: {

    // valueChanged: function(child){
    //   var newVal = child.value, key = child.key
    //   if (typeof key !== 'undefined' && _.isNot(newVal, this.value[key])){
    //     this.value.$add(key)
    //     this.value[key] = newVal
    //   }
    //   return false
    // }

  }

}


function getDefault(schema){
  var d = schema && schema.default
  return d ? _.copy(d) : {}
}


function getSubfields(schema, form, value){

  if (!value) return []

  // used to list subfield keys
  var schemaProps = schema.properties || {},
      required = schema.required || []


  // TODO: accept form.fields option?
  // var fields = form && form.fields || ['*']
  var fields = _.unionKeys(schemaProps, value/*, required*/)

  // used to build subschemas
  var patternProps = schema.patternProperties,
      addProps = schema.additionalProperties
  // default is to accept any additional property
  if (!addProps && addProps !== false) addProps = {}

  var _uid = 0
  return iterFields(fields, Object.keys(schemaProps), zipField)

  function zipField(field){
    if (_.isString(field)) field = { key: field }

    var key = field.key

    if (typeof key === 'undefined'){
      // action, etc.
      // ~unique key for track-by
      key = '___'+_uid+++'__'+JSON.stringify(field)
      return { form: field, key: key, isAction: true }
    }

    // ensure this property is observed (noop if key pre-exists as normal property)
    if (required.indexOf(key) !== -1) value.$add(key)

    // build schema for subfield
    var subschema = (key in schemaProps) ? [schemaProps[key]] : []
    if (patternProps) {
      Object.keys(patternProps).forEach(function(pk){
        if (RegExp(pk).test(key)) subschema.push(patternProps[pk])
      })
    }
    subschema = (subschema.length > 1) ? { allOf: subschema } : subschema[0] || addProps

    if (subschema === false){
      // TODO: handle disallowed additional properties
      // render as readonly, marked invalid?
      handleInvalid()
    }

    return { schema: subschema,
             form: field,
             key: key,
             // val: value[key],
             required: (required && required.indexOf(key)>-1) ? true : null }
  }
}


function iterFields(fields, defaults, cb, initVal){
  return fields.reduce(function(acc, f){
    if (f === '*'){
      defaults.forEach(function(x){
        acc.push(cb(x))
      })
    } else {
      acc.push(cb(f))
    }
    return acc
  }, initVal || [])
}
