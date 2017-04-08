const fs          = require("fs");
const path        = require("path");
const babel       = require("babel-core");
const traverse    = require("babel-traverse").default;

const wrapperCode = fs.readFileSync("runtime/wrapper.js").toString();


function processJS() {
  
}



class JSC {

  ensureDirectoryExistence(filePath) {
    var dirname = path.dirname(filePath);
    if (fs.existsSync(dirname)) {
      return true;
    }
    this.ensureDirectoryExistence(dirname);
    fs.mkdirSync(dirname);
  }

  addToBundle(content) {
    fs.appendFileSync(path.join(".jsc", "bundle.js"), content);
  }

  processFile(filePath) {
    const outPath = path.join(".jsc", filePath);
    const metadataPath = path.join(".jsc", filePath + ".metadata.json");

    try {
      const cacheMTime = fs.statSync(outPath).mtime;
      const currentMTime = fs.statSync(filePath).mtime;

      if (cacheMTime > currentMTime) {
        try {
          this.addToBundle(fs.readFileSync(outPath));
          return JSON.parse(fs.readFileSync(metadataPath));
        } catch(e) {
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

    var { ast, code } = babel.transformFileSync(filePath, {
      plugins: [
        "transform-es2015-arrow-functions",
        "transform-es2015-destructuring",
        "transform-es2015-modules-commonjs"
      ]
    });

    const basePath = path.dirname(filePath);
    const dependencies = [];
    traverse(ast, {
      CallExpression(nodePath) {
        if (nodePath.node.callee.name === "require") {
          // TODO check value is a string
          const nextDependency = path.join(basePath, nodePath.node.arguments[0].value);
          dependencies.push(nextDependency);
        }
      }
    });

    const metadata = {
      dependencies
    };

    code = wrapperCode.replace("__MODULE__CODE__", code);
    code = code.replace("__MODULE_NAME__", filePath);

    this.ensureDirectoryExistence(outPath);
    this.addToBundle(code);
    fs.writeFileSync(outPath, code);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    return metadata;
  }

  parseTree(initialPath, callStack=[]) {
    if (callStack.indexOf(initialPath) !== -1) {
      throw new Error("Error requiring '" + initialPath + "'. It was already required by another module. It has a cyclic dependency");
    }

    const { dependencies } = this.processFile(initialPath);
    dependencies.forEach(d => this.parseTree(d, callStack.concat([initialPath])));
  }

  createBundleFrom(initialPath) {
    try {
      fs.unlinkSync(path.join(".jsc", "bundle.js"));

    } catch (e) {

    }
    this.ensureDirectoryExistence(".jsc/bundle.js");
    this.addToBundle(fs.readFileSync("runtime/runtime.js").toString());  
    this.parseTree(initialPath);
    this.addToBundle('require("'+ path.dirname(initialPath) +'")("' + initialPath +'")');
  }

}


const runner = new JSC();
runner.createBundleFrom("samples/a.js");
