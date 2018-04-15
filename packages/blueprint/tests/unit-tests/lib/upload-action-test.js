const UploadAction  = require ('../../../lib/upload-action');
const {expect} = require ('chai');

describe ('lib | UploadAction', function () {
  describe ('constructor', function () {
    it ('should create an UploadAction object', function () {
      let action = new UploadAction ({uploadPath: './temp'});

      expect (action).to.have.property ('uploadPath', './temp');
      expect (action).to.have.property ('_upload');
      expect (action.storageType).to.equal ('disk');
    });
  });
});
