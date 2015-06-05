var ZSchema = require('z-schema')

var templates = require('./templates')
var _ = require('./util')
var resolveComponent = require('./resolve-component')
var components = require('./components')


module.exports = {

  name: 'VueFormidable',

  replace: false,

  template: templates.form,

  props: [ 'schema', 'form', 'value', 'path' ],

  data: function(){
    return { value: undefined,
             resolvedSchema: undefined, errors: [] }
  },

  computed: { },

  methods: {

    resolveComponent: resolveComponent,

    validate: function(){
      this.$broadcast('validationStart')
      this.validator.validate(this.value, this.schema)
      var errors = this.validator.getLastErrors()
      // TODO: broadcast or publish as nested errors object
      // this.$broadcast()
      this.errors = errors
    }

  },

  components: components,

  watch: {

    schema: function(s){
      var v = this.validator = new ZSchema()
      v.compileSchema(s)
      this.resolvedSchema = v.getResolvedSchema(s)
    }

  },

  events: {

    // valueChanged: function(child){
    //   var newVal = child.value
    //   if (_.isNot(newVal, this.value)) this.value = newVal
    //   return false
    // },

    validationRequest: function(){
      var vm = this
      _.nextTick(function(){
        vm.validate()
      })
      return false
    }

  }

}
