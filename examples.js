var draft = require('./schemas/core-metaschema-draft-04')

var schemas = [

  {
    title: 'Default components for primitive types',
    type: 'object',
    properties: {
      aString: { type: 'string', title: 'This is a string' },
      aRequiredNumber: { type: 'number', default: 42 },
      aInteger: { type: 'integer',
                  description: 'An integer is a kind of number like 1, 2, and 3.' },
      aDate: { type: 'string', format: 'date'},
      aBoolean: { type: 'boolean' },
      anEnum: { title: 'an enum', enum: [ 1, null, 's', true ] },
      anArrayOfStrings: {
        type: 'array', items: { type: 'string' }, minItems: 2
      },
      theNull: { title: 'null', type: 'null' }
    },
    required: ['aRequiredNumber']
  },

  {
    title: '{}: anything goes'
  },

  {
    title: 'Support for $ref',
    type: 'object',
    defs: {
      a: { type: 'boolean' }
    },
    properties: {
      ref_to_def: { $ref: '#/defs/a' }
    }
  },

  {
    title: 'oneOf / anyOf',
    oneOf: [ {type: 'string', title: 'A string'}, {type: 'number'} ],
    anyOf: [ { minimum: 2, placeholder: 3}, {type: 'number'} ]
  },

  {
    type: 'array',
    title: 'Array of mutable objects',
    maxItems: 2,
    items: {
      type: 'object',
      properties: {
        email: {
          title: 'Email',
          type: 'string',
          pattern: '^\\S+@\\S+$',
          description: 'Email will be used for evil.'
        },
        spam: {
          title: 'Spam',
          type: 'boolean',
          default: true
        }
      }
    }
  },

  {
    title: 'Book',
    description: 'Test circular references',
    type: 'object',
    properties: {
      booktitle: { type: 'string' },
      cites: {
        oneOf: [
          { title: 'Bibliography', $ref: '#/definitions/cites' },
          { type: 'string' }
          // { title: 'Bibliography', $ref: '#' },
        ]
      }
    },
    required: ['booktitle'],
    definitions: {
      cites: {
        type: 'array',
        minItems: 0,
        items: { $ref: '#' }
      }
    }
  },

  draft
]


module.exports = schemas.map(function(s){
  return { schema: s,
           value: undefined,
           form: undefined}
})
