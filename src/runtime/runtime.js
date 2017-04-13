var modules = {};

var process = {
  env: {
    NODE_ENV: 'DEVELOPMENT'
  }
};


function registerModule(module, initializer) {

  if (modules.hasOwnProperty(module.absolutePath)) {
    throw new Error('Module ' + name + ' is already defined');
  }
  const newModule = {
    initializer,
    exported: null,
    clientAlias: module.clientAlias,
    absolutePath: module.absolutePath
  };
  modules[module.absolutePath] = newModule
  modules[module.clientAlias] = newModule
}

function require(currentPath) {
  return function (requiredName) {
    var resolvedName = resolveFileName(currentPath, requiredName);
    var requiredModule = modules[resolvedName];
    if (!requiredModule) {
      throw new Error('Required module ' + requiredName + ' does not exists');
    }

    if (!requiredModule.exported) {
      requiredModule.exported = {};
      var module = {
        exports: requiredModule.exported
      };
      requiredModule.initializer(require(requiredModule.absolutePath), module, module.exports);
      requiredModule.exported = module.exports;
    }

    return requiredModule.exported;
  };
}

