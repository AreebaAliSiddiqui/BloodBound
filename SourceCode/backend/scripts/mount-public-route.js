// Adds the public routes to server.js (safe to run more than once). Run from SourceCode/backend: node scripts/mount-public-route.js
const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'server.js');
let src = fs.readFileSync(file, 'utf8');
if (src.includes("'/api/public'")) { console.log('Already mounted.'); process.exit(0); }
const req = "const adminRoutes = require('./routes/admin');";
const use = "app.use('/api/admin', adminRoutes);";
if (!src.includes(req) || !src.includes(use)) { console.error('server.js has unexpected content; add the two lines by hand.'); process.exit(1); }
src = src.replace(req, `${req}\nconst publicRoutes = require('./routes/public');`)
         .replace(use, `${use}\napp.use('/api/public', publicRoutes);`);
fs.writeFileSync(file, src);
console.log('Mounted /api/public in server.js');
