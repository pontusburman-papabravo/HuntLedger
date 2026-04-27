import https from 'https';
import fs from 'fs';

const url = 'https://raw.githubusercontent.com/pontusburman-papabravo/HuntLedger/main/HuntLedger-src.zip';
const out = '/tmp/huntledger-src.zip';

console.log('Downloading HuntLedger source...');
https.get(url, (res) => {
  if (res.statusCode !== 200) {
    console.log('HTTP ' + res.statusCode);
    return;
  }
  const ws = fs.createWriteStream(out);
  res.pipe(ws);
  ws.on('finish', () => {
    const s = fs.statSync(out).size;
    console.log('Downloaded: ' + s + ' bytes');
  });
  ws.on('error', e => console.error(e));
}).on('error', e => console.error(e));