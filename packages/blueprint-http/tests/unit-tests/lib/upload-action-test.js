const blueprint = require ('../../../lib');
const { UploadAction }  = blueprint;
const {expect} = require ('chai');

describe ('lib | UploadAction', function () {
  describe ('constructor', function () {
    it ('should create an UploadAction object', async function () {
      let action = new UploadAction ({uploadPath: './temp'});
      await action.configure (blueprint.app);

      expect (action).to.have.property ('uploadPath', './temp');
      expect (action).to.have.property ('_upload');
      expect (action.storageType).to.equal ('disk');
    });
  });
});
