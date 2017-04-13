const fs = require('fs');
const CSON = require('cson');

const csonToJSContent = `
  module.exports = __CONTENT__;
`;


module.exports = function processCSS({ absolutePath }) {
  const csonContent = fs.readFileSync(absolutePath).toString().replace(/\n/g, '');
  return {
    code: csonToJSContent.replace('__CONTENT__', () => JSON.stringify(CSON.parse(csonContent))),
    dependencies: [],
  };
};
