const { ResourceController, computed } = require ('@onehilltech/blueprint');
const { camelCase } = require ('lodash');

module.exports = ResourceController.extend ({
  namespace: 'stripe',

  nameWithNamespace: computed ({
    get () { return `${this.namespace}-${this.name}`; }
  }),

  id: computed ({
    get () { return `${camelCase (this.nameWithNamespace)}Id`; }
  }),

  resourceName: computed.alias ('nameWithNamespace')
});