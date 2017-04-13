const fs = require('fs');
const path = require('path');
const resolveFileName = require('./resolver');
const processJS = require('./processors/javascript.js');
const processCSS = require('./processors/css.js');
const processCSON = require('./processors/cson.js');


const resolverCode = fs.readFileSync(path.join(__dirname, 'runtime/resolver.js')).toString();
const runtimeCode = fs.readFileSync(path.join(__dirname, 'runtime/runtime.js')).toString();

const wrapperCode = `
registerModule(__MODULE_NAME__, function(require, module, exports) {
  __MODULE__CODE__
});
`;

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
    const currentMTime = fs.statSync(filePath).mtime;
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath));
      if (metadata.MTime >= currentMTime) {
        return metadata;
      }
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
    }
    return undefined;
  }

  getProcessor(extension, filePath) {
    switch (extension) {
      case '.js':
        return processJS;
      case '.css':
        return processCSS;
      case '.cson':
        return processCSON;
      default:
        throw new Error(`Missing processor to handle file of type: ${extension} from file: ${filePath}`);
    }
  }

  wrapCode(dependency, code) {
    let wrappedCode = wrapperCode.replace('__MODULE__CODE__', () => code);
    wrappedCode = wrappedCode.replace('__MODULE_NAME__', () => JSON.stringify({ absolutePath: dependency.absolutePath, clientAlias: dependency.clientAlias }));
    return wrappedCode;
  }

  processFile(dependency) {
    const { absolutePath } = dependency;

    console.log('Processing ', absolutePath);
    const outPath = path.join('.jsc', absolutePath);
    const metadataPath = path.join('.jsc', `${absolutePath}.metadata.json`);
    const cachedMatadata = this.getMetadataFromCache(outPath, metadataPath, absolutePath);

    if (cachedMatadata) {
      this.addToBundle(this.wrapCode(dependency, fs.readFileSync(outPath).toString()));
      return cachedMatadata;
    }

    const processor = this.getProcessor(path.extname(dependency.absolutePath), dependency.absolutePath);
    const { code, dependencies } = processor(dependency, resolveFileName);
    const metadata = { dependencies, MTime: new Date().getTime() };

    this.ensureDirectoryExistence(outPath);
    this.addToBundle(this.wrapCode(dependency, code));
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
    this.parseTree({ absolutePath, clientAlias: absolutePath, originator: absolutePath });
    this.addEntryPoint(absolutePath);
  }

}


module.exports = JSC;
