const fs = require('fs');
let src = fs.readFileSync('/workspaces/default/code/src/app/App.tsx', 'utf8');
const newCards = fs.readFileSync('/workspaces/default/code/bottom_cards_new.txt', 'utf8');

// Find the boundary: start of bottom grid, end just before "          </div>{/* end LEFT */}"
const startMarker = '            {/* Bottom: Activity Timeline + Top Active Hours */}';
const endMarker   = '\n          </div>{/* end LEFT */}';

const si = src.indexOf(startMarker);
const ei = src.indexOf(endMarker, si);

if (si === -1 || ei === -1) {
  console.error('markers not found', si, ei);
  process.exit(1);
}

src = src.slice(0, si) + newCards + src.slice(ei);

fs.writeFileSync('/workspaces/default/code/src/app/App.tsx', src, 'utf8');
const open = (src.match(/{/g)||[]).length;
const close = (src.match(/}/g)||[]).length;
console.log('Done. Lines:', src.split('\n').length);
console.log('Brace diff:', open - close, open === close ? '✓' : '✗');
