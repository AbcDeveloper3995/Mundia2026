const fs = require('fs');
const path = require('path');

function walkSync(dir, filelist = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      if (file !== 'node_modules') {
        filelist = walkSync(dirFile, filelist);
      }
    } else {
      if (dirFile.endsWith('.tsx')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
}

const files = walkSync(path.join(__dirname, '..', 'src'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace <Grid item xs={12} sm={6} ...> with <Grid size={{ xs: 12, sm: 6, ... }}>
  // A Grid item might have xs={...} sm={...} md={...} lg={...} xl={...}
  content = content.replace(/<Grid\s+item\b([^>]*?)>/g, (match, propsStr) => {
    // Extract xs, sm, md, lg, xl
    const sizes = {};
    let otherProps = '';

    // We'll regex match xs={12} or xs={foo ? 1 : 2} 
    // It's tricky with regex. Let's just match xs, sm, md, lg, xl and their values.
    const sizeRegex = /\b(xs|sm|md|lg|xl)=(?:\{([^}]+)\}|"([^"]+)"|'([^']+)'|(\d+))/g;
    
    let propsWithoutSizes = propsStr.replace(sizeRegex, (m, key, valBrace, valQuote1, valQuote2, valNum) => {
      const val = valBrace || valQuote1 || valQuote2 || valNum;
      sizes[key] = val;
      return ''; // remove from string
    });

    if (Object.keys(sizes).length > 0) {
      const sizeObjStr = Object.keys(sizes).map(k => `${k}: ${sizes[k]}`).join(', ');
      return `<Grid size={{ ${sizeObjStr} }}${propsWithoutSizes}>`;
    } else {
      return `<Grid${propsWithoutSizes}>`;
    }
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated Grid in ${file}`);
  }
}
