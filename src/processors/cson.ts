import * as CSON from 'cson';

const csonToJSContent = `
  module.exports = __CONTENT__;
`;


export default function processCSS({ originalCode }) {
  return {
    code: csonToJSContent.replace('__CONTENT__', () => JSON.stringify(CSON.parse(originalCode))),
    dependencies: [],
  };
};
