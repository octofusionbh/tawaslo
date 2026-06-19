const babel = require('@babel/core');
const fs = require('fs');
const code = fs.readFileSync('src/TawasaloApp.js','utf8');
try {
  babel.parseSync(code, { presets: [require.resolve('babel-preset-react-app')], filename: 'TawasaloApp.js' });
  console.log('PARSE OK — no syntax errors');
} catch(e) {
  console.log('PARSE FAILED:\n' + e.message);
  process.exit(1);
}
