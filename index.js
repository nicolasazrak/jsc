const fs          = require("fs");
const path        = require("path");
const babel       = require("babel-core");
const traverse    = require("babel-traverse").default;

const wrapperCode = fs.readFileSync("runtime/wrapper.js").toString();


function ensureDirectoryExistence(filePath) {
  var dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}


function addToBundle(content) {
  fs.appendFileSync(path.join(".jsc", "bundle.js"), content);
}


function processFile(filePath) {
  const outPath = path.join(".jsc", filePath);
  const metadataPath = path.join(".jsc", filePath + ".metadata.json");

  try {
    const cacheMTime = fs.statSync(outPath).mtime;
    const currentMTime = fs.statSync(filePath).mtime;

    if (cacheMTime > currentMTime) {
      try {
        addToBundle(fs.readFileSync(outPath));
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

  ensureDirectoryExistence(outPath);
  addToBundle(code);
  fs.writeFileSync(outPath, code);
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  return metadata;
}


function parseTree(initialPath, callStack=[]) {
  if (callStack.indexOf(initialPath) !== -1) {
    throw new Error("Error requiring '" + initialPath + "'. It was already required by another module. It has a cyclic dependency");
  }

  const { dependencies } = processFile(initialPath);
  dependencies.forEach(d => parseTree(d, callStack.concat([initialPath])));
}


function createBundleFrom(initialPath) {
  try {
    fs.unlinkSync(path.join(".jsc", "bundle.js"));

  } catch (e) {

  }
  ensureDirectoryExistence(".jsc/bundle.js");
  addToBundle(fs.readFileSync("runtime/runtime.js").toString());  
  parseTree(initialPath);
  addToBundle('require("'+ path.dirname(initialPath) +'")("' + initialPath +'")');
}


createBundleFrom("samples/a.js");
