import * as babel from 'babel-core';
import * as babylon from 'babylon';
import traverse from 'babel-traverse';
import generate from 'babel-generator';


export default function processJS({ originalCode, absolutePath }, resolver) {
  let ast;
  let code;

  if (absolutePath.includes('/node_modules/')) {
    // https://github.com/babel/babylon
    ast = babylon.parse(originalCode, {
      sourceFilename: absolutePath,
      sourceType: 'module',
    });
  } else {
    const transpiled = babel.transform(originalCode, {
      code: false,
      filename: absolutePath,
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
          throw new Error('Missing required module');
        }

        if (nodePath.node.arguments.length > 1) {
          throw new Error('Require should have only 1 argument');
        }

        const argument = nodePath.node.arguments[0];
        if (argument.type === 'BinaryExpression' && argument.operator === '+' && argument.left.type === 'StringLiteral' && argument.right.type === 'Identifier') {
          const filesInDynamicFolder = resolver.resolveDynamic(absolutePath, argument.left.value);
          console.warn(`File ${absolutePath} has a dynamic import and there are ${filesInDynamicFolder.length} possible modules to bundle. You probably do not wan't that`);
          filesInDynamicFolder.forEach(absolutePath => {
            dependencies.push({ absolutePath });
          });
          return;
        }

        if (argument.type !== 'StringLiteral') {
          console.log(argument);
          throw new Error(`Error in: ${absolutePath}. Dynamic Imports not supported (yet)`);
        }

        const requiredPath = argument.value;
        const resolvedPath = resolver.resolveFilename(absolutePath, requiredPath);
        argument.value = resolvedPath; // Replace required module by it's absolute path
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
