var winston   = require ('winston')
  , blueprint = require ('@onehilltech/blueprint')
  ;

var Account = require ('../models/Account')
  ;

function ImagesController () {

}

blueprint.controller (ImagesController);

/**
 * Get an image from the database.
 *
 * @returns {Function}
 */
ImagesController.prototype.getImage = function () {
  return function getImage (req, res) {
    var imageId = req.imageId;
    var search = {_id : imageId};
    var gridfs = blueprint.app.database.gridfs;

    gridfs.findOne (search, function (err, file) {
      if (err)
        return self.handleError (err, res, 500, 'Failed to locate image file');

      res.set ('Content-Type', file.contentType);
      gridfs.createReadStream (search).pipe (res);
    });
  };
};

module.exports = exports = ImagesController;
