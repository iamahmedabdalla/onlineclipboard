const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, 'build');

function obfuscateDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      obfuscateDirectory(filePath);
    } else if (path.extname(file) === '.js') {
      const code = fs.readFileSync(filePath, 'utf-8');
      const obfuscationResult = JavaScriptObfuscator.obfuscate(code);
      fs.writeFileSync(filePath, obfuscationResult.getObfuscatedCode());
    }
  });
}

obfuscateDirectory(sourceDir);