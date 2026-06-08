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

  // Find textTransform="..." and display="..." on Typography
  // and move them to sx
  content = content.replace(/<Typography([^>]*)textTransform=(?:"([^"]+)"|'([^']+)'|\{([^}]+)\})([^>]*)>/g, (match, p1, p2, p3, p4, p5) => {
    let val = p2 || p3 || p4;
    let combined = p1 + p5;
    let quote = p4 ? val : `'${val}'`;
    if (combined.includes('sx={{')) {
      return `<Typography${combined.replace(/sx=\{\{/, `sx={{ textTransform: ${quote}, `)}>`
    } else {
      return `<Typography${p1}sx={{ textTransform: ${quote} }}${p5}>`;
    }
  });

  content = content.replace(/<Typography([^>]*)display=(?:"([^"]+)"|'([^']+)'|\{([^}]+)\})([^>]*)>/g, (match, p1, p2, p3, p4, p5) => {
    let val = p2 || p3 || p4;
    let combined = p1 + p5;
    let quote = p4 ? val : `'${val}'`;
    if (combined.includes('sx={{')) {
      return `<Typography${combined.replace(/sx=\{\{/, `sx={{ display: ${quote}, `)}>`
    } else {
      return `<Typography${p1}sx={{ display: ${quote} }}${p5}>`;
    }
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated Typography in ${file}`);
  }
}
