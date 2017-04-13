const fs = require('fs');
const babel = require('babel-core');
const babylon = require('babylon');
const traverse = require('babel-traverse').default;


module.exports = function processJS({ absolutePath, clientAlias }, resolveFileName) {
  let ast;
  let code;

  if (absolutePath.startsWith('./node_modules/')) {
    code = fs.readFileSync(absolutePath).toString();
    ast = babylon.parse(code, {
      sourceType: 'module',
    });
  } else {
    const transpiled = babel.transformFileSync(absolutePath, {
      plugins: [
        'transform-es2015-arrow-functions',
        'transform-es2015-destructuring',
        'transform-es2015-modules-commonjs',
        'transform-react-jsx',
      ],
    });
    ast = transpiled.ast;
    code = transpiled.code;
  }


  const dependencies = [];
  traverse(ast, {
    CallExpression(nodePath) {
      if (nodePath.node.callee.name === 'require') {
          // TODO check value is a string
        const requiredPath = nodePath.node.arguments[0].value;
        dependencies.push(resolveFileName(absolutePath, requiredPath));
      }
    },
  });

  return { code, dependencies };
};
