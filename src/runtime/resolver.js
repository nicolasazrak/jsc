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
  var divisor = '/';

  if (to.indexOf(divisor) === -1) {
    return './node_modules/' + to;
  }

  if (to.endsWith('/')) {
    to = to + 'index.js';
  }

  var parts = to.split('/');
  var dots = parts[parts.length - 1].split('.');
  if (dots.length === 1) {
    to = to + '.js';
  }

  if (to[0] !== '.') {
    return './node_modules/' + to;
  }

  let fromParts = from.split('/');
  fromParts.pop();
  return './' + join(fromParts.join('/'), to);
}


try {
  if (module) {
    module.exports = {
      resolveFileName: resolveFileName
    };
  }
} catch (e) {}