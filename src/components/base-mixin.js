var templates = require('../templates')
var _ = require('../util')
var resolveComponent = require('../resolve-component')


module.exports = {

  replace: true,

  props: [ 'schema', 'form', 'value', 'path', 'key', 'required' ],

  // data: function(){
  //   return { errors: [] }
  // },

  computed: {

    value: {
      get: function(){
        return this.$data.value
      },
      set: function(x){
        this.$data.value = this.castValue ? this.castValue(x) : x
      }
    },

    // FIXME: use form param or add properties to schema?
    title: _.fromForm('title', true),
    description: _.fromForm('description', true),
    readonly: _.fromForm('readonly'),
    disabled: _.fromForm('disabled'),
    hidden: _.fromForm('hidden'),
    placeholder: _.fromForm('placeholder', true)

  },

  methods: {

    resolveComponent: resolveComponent

    // idempotent function implemented in concrete classes
    // castValue: function(x){
    //   return x
    // }

  },

  watch: {

    value: function(val, previous){
      if (_.isNot(val, previous)){
        this.$dispatch('validationRequest')
        // FIXME: events paralleling props bindings, needed (?) to support:
        // 1. array of primitive values (OK in vue 0.12)
        // 2. setting default value from child vm
        // dispatch after initial binding
        // var vm = this
        // _.nextTick(function(){
        //   vm.$dispatch('valueChanged', vm)
        // })
      }
    }

  },

  events: {

    // validationStart: function(){
    //   this.errors = []
    // }

  }

}
