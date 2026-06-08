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

  // Find <Typography ... fontWeight={xxx} ...>
  // We'll just replace ` fontWeight={...}` with ` sx={{ fontWeight: ... }}`. 
  // If there's already sx={{...}}, we'll merge them.
  content = content.replace(/<Typography([^>]*)fontWeight=\{([^}]+)\}([^>]*)>/g, (match, p1, p2, p3) => {
    // Check if there's already an sx= prop in p1 or p3
    let combinedProps = p1 + p3;
    if (combinedProps.includes('sx={{')) {
      // It has sx={{ ... }}, inject fontWeight: p2, into it
      return `<Typography${combinedProps.replace(/sx=\{\{/, `sx={{ fontWeight: ${p2}, `)}>`
    } else {
      return `<Typography${p1}sx={{ fontWeight: ${p2} }}${p3}>`;
    }
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated Typography in ${file}`);
  }
}
