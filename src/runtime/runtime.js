var modules = {};
var global = {};
var process = {
  env: {
    NODE_ENV: 'DEVELOPMENT'
  }
};

function registerModule(name, initializer) {
  if (modules.hasOwnProperty(name)) {
    throw new Error('Module ' + name + ' is already defined');
  }
  modules[name] = {
    initializer,
    exported: null,
  }
}

function require(moduleName) {
  var requiredModule = modules[moduleName];
  if (!requiredModule) {
    throw new Error('No module: ' + moduleName);
  }

  if (!requiredModule.exported) {
    requiredModule.exported = {};
    var module = {
      exports: requiredModule.exported
    };
    requiredModule.initializer(require, module, module.exports);
    requiredModule.exported = module.exports;
  }

  return requiredModule.exported;
}

