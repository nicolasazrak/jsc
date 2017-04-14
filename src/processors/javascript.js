const babel = require('babel-core');
const babylon = require('babylon');
const traverse = require('babel-traverse').default;


module.exports = function processJS({ originalCode, absolutePath, clientAlias }, resolveFileName) {
  let ast;
  let code;

  if (absolutePath.startsWith('./node_modules/')) {
    ast = babylon.parse(originalCode, {
      sourceType: 'module',
    });
    code = originalCode;
  } else {
    const transpiled = babel.transform(originalCode, {
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
        if (!nodePath.node.arguments[0]) {
          throw nodePath.buildCodeFrameError('Missing required module');
        }

        if (nodePath.node.arguments[0].type !== 'StringLiteral') {
          throw nodePath.buildCodeFrameError('Dynamic Imports not supported (yet)');
        }

        const requiredPath = nodePath.node.arguments[0].value;
        dependencies.push(Object.assign({ originator: absolutePath }, resolveFileName(absolutePath, requiredPath)));
      }
    },
  });

  return { code, dependencies };
};
