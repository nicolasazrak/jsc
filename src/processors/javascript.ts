import * as babel from 'babel-core';
import * as babylon from 'babylon';
import traverse from 'babel-traverse';
import generate from 'babel-generator';


export default function processJS({ originalCode, absolutePath }, resolver) {
  let ast;
  let code;

  if (absolutePath.includes('/node_modules/')) {
    ast = babylon.parse(originalCode, {
      sourceType: 'module',
    });
  } else {
    const transpiled = babel.transform(originalCode, {
      code: false,
      // filename: absolutePath,
      plugins: [
        'transform-class-properties',
        'transform-es2015-classes',
        'transform-es2015-arrow-functions',
        'transform-es2015-destructuring',
        'transform-es2015-modules-commonjs',
        'transform-flow-strip-types',
        'transform-react-jsx',
        'syntax-class-properties',
        'transform-object-rest-spread',
      ],
    });
    ast = transpiled.ast;
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
        const resolvedPath = resolver.resolveFilename(absolutePath, requiredPath);
        nodePath.node.arguments[0].value = resolvedPath; // Replace required module by it's absolute path
        dependencies.push({ absolutePath: resolvedPath });
      }
    },
  });

  return { 
    // Generate docs at
    // https://github.com/babel/babel/tree/7.0/packages/babel-generator
    code: generate(ast, { /* options */ }, originalCode).code,
    dependencies 
  };
};
