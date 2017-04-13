const fs = require('fs');

const cssToJSContent = `
  var css = '__CONTENT__',
  head = document.head || document.getElementsByTagName('head')[0],
  style = document.createElement('style');

  style.type = 'text/css';
  if (style.styleSheet){
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }

  head.appendChild(style);

  module.exports = {};
`;


module.exports = function processCSS({ absolutePath }) {
  const cssContent = fs.readFileSync(absolutePath).toString().replace(/\n/g, '');
  return {
    code: cssToJSContent.replace('__CONTENT__', () => cssContent),
    dependencies: [],
  };
};
