const {expect}  = require ('chai');

const blueprint = require ('@onehilltech/blueprint');
const { request } = require ('@onehilltech/blueprint-testing');

describe ('lib:resource-controller', function () {
  describe ('create', function () {
    it ('should create a resource', function () {
      const project = {title: 'Sequelize', description: 'Sequelize integration into blueprint'};

      return request ()
        .post ('/projects')
        .send ({ project })
        .expect (200, { project: Object.assign (project, { id: 1 })});
    });
  });

  describe ('getAll', function () {
    it ('get all the resources', function () {
      const project = {title: 'Sequelize', description: 'Sequelize integration into blueprint'};

      return request ()
        .post ('/projects')
        .send ({ project })
        .then (res => {
          return request ()
            .get ('/projects')
            .expect (200, {
              projects: [ Object.assign ({}, project, { id: 1 })]
            });
        });
    });
  });

  describe ('getOne', function () {
    it ('should get a single resource', function () {
      const project = {title: 'Sequelize', description: 'Sequelize integration into blueprint'};

      return request ()
        .post ('/projects')
        .send ({ project })
        .then (res => {
          return request ()
            .get ('/projects/1')
            .expect (200, { project: Object.assign (project, { id: 1 })});
        });
    });
  });

  describe ('delete', function () {
    it ('should delete a single resource', function () {
      const project = {title: 'Sequelize', description: 'Sequelize integration into blueprint'};

      return request ()
        .post ('/projects')
        .send ({ project })
        .then (res => {
          return request ()
            .delete ('/projects/1')
            .expect (200, 'true');
        });
    });

    it ('should not double delete a resource', function () {
      const project = {title: 'Sequelize', description: 'Sequelize integration into blueprint'};

      return request ()
        .post ('/projects')
        .send ({ project })
        .then (res => {
          return request ()
            .delete ('/projects/1')
            .expect (200, 'true')
            .then (res => {
              return request ()
                .delete ('/projects/1')
                .expect (404, { errors:
                    [ { code: 'not_found', detail: 'Not found', status: '404' } ] });
            })
        });
    });
  });
});