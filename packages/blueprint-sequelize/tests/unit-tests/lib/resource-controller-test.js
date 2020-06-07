
const { request } = require ('@onehilltech/blueprint-testing');
const { seed, lean } = require ('../../../lib');

describe ('lib:resource-controller', function () {
  describe ('create', function () {
    it ('should create a resource', function () {
      const project = {title: 'Sequelize', description: 'Sequelize integration into blueprint'};

      return request ()
        .post ('/projects')
        .send ({ project })
        .expect (200, { project: Object.assign ({}, project, { id: 3 })});
    });
  });

  describe ('getAll', function () {
    it ('get all the resources', function () {
      const { projects } = seed ();

      return request ()
        .get ('/projects')
        .expect (200, {
          projects: lean (projects)
        });
    });
  });

  describe ('getOne', function () {
    it ('should get a single resource', function () {
      const { projects: [ project ]} = seed ();

      return request ()
        .get (`/projects/${project.id}`)
        .expect (200, { project: lean (project) });
    });
  });

  describe ('delete', function () {
    it ('should delete a single resource', function () {
      const { projects: [ project ]} = seed ();

      return request ()
        .delete (`/projects/${project.id }`)
        .expect (200, 'true');
    });

    it ('should not double delete a resource', function () {
      const { projects: [ project ]} = seed ();

      return request ()
        .delete (`/projects/${project.id}`)
        .expect (200, 'true')
        .then (res => {
          return request ()
            .delete (`/projects/${project.id}`)
            .expect (404, { errors:
                [ { code: 'not_found', detail: 'Not found', status: '404' } ] });
        });
    });
  });
});