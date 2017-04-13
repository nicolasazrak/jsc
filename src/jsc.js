const fs = require('fs');
const path = require('path');
const babel = require('babel-core');
const babylon = require('babylon');
const traverse = require('babel-traverse').default;

const wrapperCode = fs.readFileSync(path.join(__dirname, 'runtime/wrapper.js')).toString();
const resolverCode = fs.readFileSync(path.join(__dirname, 'runtime/resolver.js')).toString();
const runtimeCode = fs.readFileSync(path.join(__dirname, 'runtime/runtime.js')).toString();


function resolveFileName(from, to) {
  const divisor = '/';

  if (!to.includes(divisor)) {
    const packageDefinition = JSON.parse(fs.readFileSync(`node_modules/${to}/package.json`));
    return {
      absolutePath: `./node_modules/${to}/${packageDefinition.main || 'index.js'}`,
      clientAlias: `./node_modules/${to}`,
    };
  }

  if (to[to.length - 1] === divisor) {
    to = `${to}index.js`; // eslint-disable-line
  }

  if (path.extname(to) === '') {
    to = `${to}.js`; // eslint-disable-line
  }

  if (to[0] !== '.') {
    return {
      absolutePath: `./node_modules/${to}`,
      clientAlias: `./node_modules/${to}`,
    };
  }

  return {
    absolutePath: `./${path.join(path.dirname(from), to)}`,
    clientAlias: `./${path.join(path.dirname(from), to)}`,
  };
}


function processJS({ absolutePath, clientAlias }) {
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

  let wrappedCode = wrapperCode.replace('__MODULE__CODE__', () => code);
  wrappedCode = wrappedCode.replace('__MODULE_NAME__', () => JSON.stringify({ absolutePath, clientAlias }));

  return { code: wrappedCode, dependencies };
}


class JSC {

  constructor() {
    this.processedFiles = [];
  }

  ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return;
    }
    this.ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
  }

  addToBundle(content) {
    fs.appendFileSync(path.join('.jsc', 'bundle.js'), content);
  }

  getMetadataFromCache(outPath, metadataPath, filePath) {
    // TODO save mtime in metadata file to avoid reading two files
    try {
      const cacheMTime = fs.statSync(outPath).mtime;
      const currentMTime = fs.statSync(filePath).mtime;

      if (cacheMTime > currentMTime) {
        try {
          return JSON.parse(fs.readFileSync(metadataPath));
        } catch (e) {
          if (e.code !== 'ENOENT') {
            throw e;
          }
        }
      }
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
    }
    return undefined;
  }

  processFile(dependency) {
    const { absolutePath } = dependency;

    console.log('Processing ', absolutePath);
    const outPath = path.join('.jsc', absolutePath);
    const metadataPath = path.join('.jsc', `${absolutePath}.metadata.json`);
    const cachedMatadata = this.getMetadataFromCache(outPath, metadataPath, absolutePath);

    if (cachedMatadata) {
      this.addToBundle(fs.readFileSync(outPath));
      return cachedMatadata;
    }

    const { code, dependencies } = processJS(dependency);
    const metadata = { dependencies };

    this.ensureDirectoryExistence(outPath);
    this.addToBundle(code);
    fs.writeFileSync(outPath, code);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    return metadata;
  }

  parseTree(dependency, callStack = []) {
    const { absolutePath } = dependency;
    if (this.processedFiles.includes(absolutePath)) {
      return;
    }
    if (callStack.indexOf(absolutePath) !== -1) {
      throw new Error(`Error requiring '${absolutePath}'. It was already required by another module. It has a cyclic dependency`);
    }

    const { dependencies } = this.processFile(dependency);
    dependencies.forEach(d => this.parseTree(d, callStack.concat(absolutePath)));
    this.processedFiles.push(absolutePath);
  }

  cleanBundle() {
    try {
      fs.unlinkSync(path.join('.jsc', 'bundle.js'));
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
    }
  }

  addEntryPoint(absolutePath) {
    const dirname = path.dirname(absolutePath);
    const basename = path.basename(absolutePath);

    this.addToBundle(`require("${dirname}/")("./${basename}")`);
  }

  createBundleFrom(absolutePath) {
    this.cleanBundle();
    this.ensureDirectoryExistence('.jsc/bundle.js');
    this.addToBundle(resolverCode);
    this.addToBundle(runtimeCode);
    this.parseTree({ absolutePath, clientAlias: absolutePath });
    this.addEntryPoint(absolutePath);
  }

}


module.exports = {
  JSC,
  resolveFileName,
  processJS,
};
