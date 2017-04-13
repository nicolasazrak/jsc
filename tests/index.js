const { it, describe } = require('mocha');
const { expect } = require('chai');
const { resolveFileName } = require('../src/index.js');
const { resolveFileName: runtimeResolver } = require('../src/runtime/resolver.js');


describe('JSC', () => {
  describe('resolveFileName()', () => {
    [
      {
        from: './src/a.js',
        to: './b.js',
        shouldBe: './src/b.js',
        description: 'should work from same folder script',
      },
      {
        from: './src/a.js',
        to: './otherpath/b.js',
        shouldBe: './src/otherpath/b.js',
        description: 'should work for a folder script',
      },
      {
        from: './src/a.js',
        to: './otherpath/',
        shouldBe: './src/otherpath/index.js',
        description: 'should work import folder and use /index.js',
      },
      {
        from: './src/a.js',
        to: './somefile',
        shouldBe: './src/somefile.js',
        description: 'should work without extension',
      },
      {
        from: './src/a.js',
        to: 'lodash/isNumber',
        shouldBe: './node_modules/lodash/isNumber.js',
        description: 'should work on a node module',
      },
      {
        from: './node_modules/lodash/isNumber.js',
        to: './somedep',
        shouldBe: './node_modules/lodash/somedep.js',
        description: 'should work on a relative import inside a node module',
      },
      {
        from: './src/a.js',
        to: 'lodash',
        shouldBe: './node_modules/lodash/lodash.js',
        description: 'should work on main package of a node module',
      },
    ].forEach((d) => {
      it(d.description, () => {
        expect(resolveFileName(d.from, d.to).absolutePath).to.eql(d.shouldBe);
        expect(resolveFileName(d.from, d.to).clientAlias).to.eql(runtimeResolver(d.from, d.to));
      });
    });
  });
});
