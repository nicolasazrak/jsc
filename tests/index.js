const { it, describe } = require('mocha');
const { expect } = require('chai');
const { resolveFileName } = require('../src/index.js');
const { resolveFileName: runtimeResolver } = require('../src/runtime/runtime.js');


describe('JSC', () => {
  describe('resolveFileName()', () => {
    it('should work from same folder script', () => {
      expect(resolveFileName('./src/a.js', './b.js').absolutePath).to.eql('./src/b.js');
      expect(runtimeResolver('./src/a.js', './b.js')).to.eql('./src/b.js');
    });
    it('should work for a folder script', () => {
      expect(resolveFileName('./src/a.js', './otherpath/b.js').absolutePath).to.eql('./src/otherpath/b.js');
      expect(runtimeResolver('./src/a.js', './otherpath/b.js')).to.eql('./src/otherpath/b.js');
    });
    it('should work import folder and use /index.js', () => {
      expect(resolveFileName('./src/a.js', './otherpath/').absolutePath).to.eql('./src/otherpath/index.js');
      expect(runtimeResolver('./src/a.js', './otherpath/')).to.eql('./src/otherpath/index.js');
    });
    it('should work without extension', () => {
      expect(resolveFileName('./src/a.js', './somefile').absolutePath).to.eql('./src/somefile.js');
      expect(runtimeResolver('./src/a.js', './somefile')).to.eql('./src/somefile.js');
    });
    it('should work on a node module', () => {
      expect(resolveFileName('./src/a.js', 'lodash/isNumber').absolutePath).to.eql('./node_modules/lodash/isNumber.js');
      expect(runtimeResolver('./src/a.js', 'lodash/isNumber')).to.eql('./node_modules/lodash/isNumber.js');
    });
    it('should work on a relative import inside a node module', () => {
      expect(resolveFileName('./node_modules/lodash/isNumber.js', './somedep').absolutePath).to.eql('./node_modules/lodash/somedep.js');
      expect(runtimeResolver('./node_modules/lodash/isNumber.js', './somedep')).to.eql('./node_modules/lodash/somedep.js');
    });
    it('should work on main package of a node module', () => {
      expect(resolveFileName('./src/a.js', 'lodash').absolutePath).to.eql('./node_modules/lodash/lodash.js');
      // expect(runtimeResolver('./src/a.js', 'lodash')).to.eql('./node_modules/lodash');
    });
  });
});
