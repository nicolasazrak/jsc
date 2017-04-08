var modules = {};

function initModule(name, initializer) {
  modules[name] = {
    initializer: initializer,
    exported: null
  };
}

function pathJoin(base, relative) {
    var stack = base.split("/"),
        parts = relative.split("/");
    stack.pop(); // remove current file name (or empty string)
                 // (omit if "base" is the current folder without trailing slash)
    for (var i=0; i<parts.length; i++) {
        if (parts[i] == ".")
            continue;
        if (parts[i] == "..")
            stack.pop();
        else
            stack.push(parts[i]);
    }
    return stack.join("/");
}

function require(currentPath) {
  return function(requiredName) {
    var absolutePath = pathJoin(currentPath, requiredName);
    var requiredModule = modules[absolutePath];
    if (!requiredModule) {
      throw new Error("Required module " + requiredName + " does not exists");
    }

    if (!requiredModule.exported) {
      requiredModule.exported = {};
      var nextFile = pathJoin(currentPath, requiredName);
      requiredModule.initializer(require(nextFile), requiredModule.exported);
    }

    return requiredModule.exported;
  }
}
