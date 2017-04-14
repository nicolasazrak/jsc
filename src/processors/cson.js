const CSON = require('cson');

const csonToJSContent = `
  module.exports = __CONTENT__;
`;


module.exports = function processCSS({ originalCode }) {
  return {
    code: csonToJSContent.replace('__CONTENT__', () => JSON.stringify(CSON.parse(originalCode))),
    dependencies: [],
  };
};
