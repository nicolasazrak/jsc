import * as fs from 'fs';
import * as path from 'path';
import * as resolve from 'resolve';


function recursiveReaddirSync(initialPath: string): string[] {
  var list = [];
  var files = fs.readdirSync(initialPath);
  var stats;

  files.forEach(function (file) {
    stats = fs.lstatSync(path.join(initialPath, file));
    if(stats.isDirectory()) {
      list = list.concat(recursiveReaddirSync(path.join(initialPath, file)));
    } else {
      list.push(path.join(initialPath, file));
    }
  });

  return list;
}

export default class Resolver {

  resolveFilename(from: string, to: string): string {
    const toWebpackCompatible = to.substring(to.lastIndexOf("!") + 1); // Make it work even if it uses ! for webpack loaders
    const resolved = resolve.sync(toWebpackCompatible, {
      basedir: path.dirname(from),
      packageFilter: function(pkg) {
        if (pkg.browser && typeof pkg.browser === 'string') {
          pkg.main = pkg.browser;
          return pkg;
        }

        if (pkg.browser && typeof pkg.browser === 'object' && pkg.main && pkg.browser.hasOwnProperty(pkg.main)) {
          pkg.main = pkg.browser[pkg.main];
          return pkg;
        }
        
        return pkg;
      }
    });

    if (resolve.isCore(resolved)) {
      throw new Error(`Package ${from} required ${to} which is a core package not available in browser`);
    }

    return resolved;
  }

  // This method is really doubtful to work 
  resolveDynamic(from: string, to: string): string[] {
    return recursiveReaddirSync(path.join(path.dirname(from), to));
  }

}
