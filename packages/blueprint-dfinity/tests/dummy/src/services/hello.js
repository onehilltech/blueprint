const { Service } = require ('@onehilltech/blueprint');
const {actor} = require ("../../../../lib");

module.exports = class HelloService extends Service {
  @actor
  hello;

  sayHello (name) {
    return this.hello.greet (name);
  }
};
