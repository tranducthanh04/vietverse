// Pass the installed @vercel/express entry file; no CLI download or deploy.
const assert = require('node:assert/strict');
const path = require('node:path');
const { entrypointCallback } = require(process.argv[2]);
const workPath = path.resolve(process.argv[3] || path.join(__dirname, '..'));
entrypointCallback({ workPath, files: {}, config: {} }).then(selected => {
  assert.equal(selected.replaceAll('\\', '/'), 'src/index.ts',
    'Native Express must select the DB-gated default handler');
  console.log(`Native Express selected ${selected}`);
}).catch(error => { console.error(error); process.exitCode = 1; });
