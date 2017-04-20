import * as _ from  'lodash';
import * as path from  'path';
import * as fs from  'fs';
import processJS from  './processors/javascript.js';
import processCSS from  './processors/css.js';
import processCSON from  './processors/cson.js';
import Resolver from './resolver';


type FilePath = string;
type Proccessor = (Dependency, any) => any;
type Dependency = {
  absolutePath: FilePath,
  originalCode?: string
};


const runtimeCode = fs.readFileSync(path.join(__dirname, 'runtime/runtime.js')).toString();

const wrapperCode = `
registerModule(__MODULE_NAME__, function(require, module, exports) {
  __MODULE__CODE__
});
`;

const processors = {
  '.js': processJS,
  '.css': processCSS,
  '.cson': processCSON,
};



export default class JSC {

  processedFiles: FilePath[]

  constructor() {
    this.processedFiles = [];
  }

  ensureDirectoryExistence(filePath: FilePath) {
    const dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return;
    }
    this.ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
  }

  addToBundle(content: string) {
    fs.appendFileSync(path.join('.jsc', 'bundle.js'), content);
  }

  getMetadataFromCache(outPath, metadataPath, filePath) {
    const currentMTime = fs.statSync(filePath).mtime;
    try {
      const metadata = JSON.parse(fs.readFileSync(metadataPath).toString());
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

  readFile(contentPath: FilePath) {
    return fs.readFileSync(contentPath).toString();
  }

  getProcessor(extension: string, filePath: FilePath): Proccessor {
    if (Object.prototype.hasOwnProperty.call(processors, extension)) {
      return processors[extension];
    }

    throw new Error(`Missing processor to handle file of type: ${extension} from file: ${filePath}`);
  }

  wrapCode(dependency: Dependency, code: string): string {
    let wrappedCode = wrapperCode.replace('__MODULE__CODE__', () => code);
    wrappedCode = wrappedCode.replace('__MODULE_NAME__', () => JSON.stringify(dependency.absolutePath));
    return wrappedCode;
  }

  getResolver() {
    return new Resolver();
  }

  processFile(dependency: Dependency, requiredBy) {
    const { absolutePath } = dependency;

    console.log('Processing ', absolutePath, '<--- Required by ', requiredBy);
    const outPath = path.join('.jsc', absolutePath);
    const metadataPath = path.join('.jsc', `${absolutePath}.metadata.json`);
    const cachedMatadata = this.getMetadataFromCache(outPath, metadataPath, absolutePath);

    if (cachedMatadata) {
      this.addToBundle(this.wrapCode(dependency, fs.readFileSync(outPath).toString()));
      return cachedMatadata;
    }

    const extension = path.extname(dependency.absolutePath);
    const processor = this.getProcessor(extension, dependency.absolutePath);
    dependency.originalCode = this.readFile(absolutePath);
    const proccessed = processor(dependency, this.getResolver());
    const metadata = { dependencies: proccessed.dependencies, MTime: new Date().getTime() };

    this.ensureDirectoryExistence(outPath);
    this.addToBundle(this.wrapCode(dependency, proccessed.code));
    fs.writeFileSync(outPath, proccessed.code);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    return metadata;
  }

  parseTree(dependency: Dependency, callStack = []) {
    const { absolutePath } = dependency;
    if (this.processedFiles.includes(absolutePath)) {
      return;
    }
    if (callStack.indexOf(absolutePath) !== -1) {
      throw new Error(`Error requiring '${absolutePath}'. It was already required by another module. It has a cyclic dependency`);
    }

    const { dependencies } = this.processFile(dependency, _.last(callStack));
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

  addEntryPoint(absolutePath: FilePath) {
    this.addToBundle(`require("${absolutePath}")`);
  }

  createBundleFrom(absolutePath: FilePath) {
    this.cleanBundle();
    this.ensureDirectoryExistence('.jsc/bundle.js');
    this.addToBundle(runtimeCode);
    this.parseTree({ absolutePath });
    this.addEntryPoint(absolutePath);
  }

}