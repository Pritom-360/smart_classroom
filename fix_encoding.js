const fs = require('fs');

// Fix donation.html
let content = fs.readFileSync('e:/Websites/smart-classroom/donation.html', 'utf8');

// Fix corrupted em-dash characters
content = content.replace(/â€"/g, '—');
content = content.replace(/â€"/g, '—');
content = content.replace(/\u00e2\u20ac\u201c/g, '—');
content = content.replace(/\u00e2\u20ac\u201d/g, '—');

fs.writeFileSync('e:/Websites/smart-classroom/donation.html', content, 'utf8');
console.log('Donation page encoding fixed!');
