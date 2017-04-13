let modules = {};


function registerModule(name, initializer) {
  if (modules.hasOwnProperty(name)) {
    throw new Error('Module ' + name + ' is already defined');
  }
  modules[name] = {
    initializer,
    exported: null,
  };
}

function join(/* path segments */) {
  // Split the inputs into a list of path commands.
  let parts = [];
  for (let i = 0, l = arguments.length; i < l; i++) {
    parts = parts.concat(arguments[i].split('/'));
  }
  // Interpret the path commands to get the new resolved path.
  const newParts = [];
  for (let i = 0, l = parts.length; i < l; i++) {
    const part = parts[i];
    // Remove leading and trailing slashes
    // Also remove "." segments
    if (!part || part === '.') continue;
    // Interpret ".." to pop the last segment
    if (part === '..') newParts.pop();
    // Push new path segments.
    else newParts.push(part);
  }
  // Preserve the initial slash if there was one.
  if (parts[0] === '') newParts.unshift('');
  // Turn back into a single string path.
  return newParts.join('/') || (newParts.length ? '/' : '.');
}

function resolveFileName(from, to) {
  if (to.endsWith('/')) {
    to = `${to}index.js`; // eslint-disable-line
  }

  let parts = to.split('/');
  let dots = parts[parts.length - 1].split('.');
  if (dots.length === 1) {
    to = `${to}.js`; // eslint-disable-line
  }

  if (!to.startsWith('.')) {
    return `./node_modules/${to}`;
  }

  let fromParts = from.split('/');
  fromParts.pop();
  return `./${join(fromParts.join('/'), to)}`;
}

function require(currentPath) {
  return function (requiredName) {
    let resolvedName = resolveFileName(currentPath, requiredName);
    let requiredModule = modules[resolvedName];
    if (!requiredModule) {
      throw new Error('Required module ' + requiredName + ' does not exists');
    }

    if (!requiredModule.exported) {
      requiredModule.exported = {};
      var module = {
        exports: requiredModule.exported
      };
      requiredModule.initializer(require(resolvedName), module, module.exports);
      requiredModule.exported = module.exports;
    }

    return requiredModule.exported;
  };
}

try {
  if (module) {
    module.exports = {
      resolveFileName: resolveFileName
    };
  }
} catch (e) {}