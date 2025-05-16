import fs from 'fs';
import https from 'https';
import next from 'next';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  https
    .createServer(
      {
        key: fs.readFileSync('./key.pem'),
        cert: fs.readFileSync('./cert.pem'),
      },
      (req, res) => {
        handle(req, res);
      }
    )
    .listen(3000, (err?: Error) => {
      if (err) throw err;
      console.log('> Ready on https://192.168.1.76:3000');
    });
});
