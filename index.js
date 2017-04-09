const { JSC } = require('./src/index.js');


const runner = new JSC();
runner.createBundleFrom('./samples/a.js');
