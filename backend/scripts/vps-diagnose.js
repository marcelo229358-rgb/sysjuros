const { Client } = require('ssh2');

function run(cmd) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(cmd, (err, stream) => {
        if (err) return reject(err);
        let out = '';
        stream.on('data', (d) => (out += d));
        stream.stderr.on('data', (d) => (out += d));
        stream.on('close', (code) => resolve({ code, out }));
      });
    }).on('error', reject);
    conn.connect({
      host: '157.173.119.168',
      port: 22,
      username: 'root',
      password: 'Motogp1020@',
      readyTimeout: 30000,
    });
  });
}

(async () => {
  const cmds = [
    'cd /root/sysjuros && docker compose -f docker-compose.prod.yml --env-file .env.prod ps',
    'cd /root/sysjuros && docker compose -f docker-compose.prod.yml --env-file .env.prod logs --tail=40 frontend',
    'cd /root/sysjuros && docker compose -f docker-compose.prod.yml --env-file .env.prod logs --tail=40 backend',
    'grep -E "^(FRONTEND_URL|VITE_API_URL|VITE_EMPRESA_ID)=" /root/sysjuros/.env.prod | sed "s/=.*/=***REDACTED***/"',
    'docker exec syscontabel-frontend wget -qO- http://localhost/ 2>&1 | head -5',
  ];
  for (const cmd of cmds) {
    console.log('\n=== ' + cmd.split('&&').pop().trim() + ' ===');
    const r = await run(cmd);
    console.log(r.out);
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
