const blueprint = require ('@onehilltech/blueprint');
const { UploadAction } = require ('../../../src/lib');
const { expect} = require ('chai');

class TestUploadAction extends UploadAction {
  uploadPath = './temp';
}

describe ('lib | UploadAction', function () {
  describe ('constructor', function () {
    it ('should create an UploadAction object', async function () {
      const action = new TestUploadAction ();
      await action.configure (blueprint.app);

      expect (action).to.have.property ('uploadPath', './temp');
      expect (action).to.have.property ('_upload');
      expect (action.storageType).to.equal ('disk');
    });
  });
});
