import * as fs from 'fs';
import * as path from 'path';
import * as resolve from 'resolve';


export default class Resolver {

  resolveFilename(from: string, to: string): string {
    return resolve.sync(to, {
      basedir: path.dirname(from)
    });
  }

}
