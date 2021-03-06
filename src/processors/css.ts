const cssToJSContent = `
  var css = "",
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


export default function processCSS({ originalCode }) {
  return {
    code: cssToJSContent.replace('__CONTENT__', () => "''"),
    dependencies: [],
  };
};
