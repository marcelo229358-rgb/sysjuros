/**
 * Diagnóstico remoto na VPS via SSH.
 *
 * Variáveis: mesmas de vps-deploy.js (vps.env.local)
 *
 * Uso:
 *   node backend/scripts/vps-diagnose.js
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

function loadEnvFile() {
  const candidates = [
    path.join(__dirname, 'vps.env.local'),
    path.join(__dirname, 'vps.env'),
    path.join(process.cwd(), 'vps.env.local'),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
    break;
  }
}

function requireEnv(name) {
  const val = process.env[name];
  if (!val) {
    console.error(`[vps-diagnose] Variável obrigatória ausente: ${name}`);
    process.exit(1);
  }
  return val;
}

function sshConnect() {
  loadEnvFile();
  const host = requireEnv('VPS_HOST');
  const username = requireEnv('VPS_USER');
  const port = Number(process.env.VPS_PORT || 22);
  const keyPath = process.env.VPS_SSH_KEY_PATH;
  const password = process.env.VPS_PASSWORD;
  const deployDir = process.env.VPS_DEPLOY_DIR || '/root/sysjuros';

  if (!keyPath && !password) {
    console.error('[vps-diagnose] Defina VPS_SSH_KEY_PATH ou VPS_PASSWORD.');
    process.exit(1);
  }

  const opts = { host, port, username, readyTimeout: 30000 };
  if (keyPath) {
    opts.privateKey = fs.readFileSync(keyPath);
    if (process.env.VPS_SSH_PASSPHRASE) opts.passphrase = process.env.VPS_SSH_PASSPHRASE;
  } else {
    opts.password = password;
  }

  return { opts, deployDir };
}

function run(cmd, { opts }) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    conn
      .on('ready', () => {
        conn.exec(cmd, (err, stream) => {
          if (err) return reject(err);
          let out = '';
          stream.on('data', (d) => (out += d));
          stream.stderr.on('data', (d) => (out += d));
          stream.on('close', (code) => resolve({ code, out }));
        });
      })
      .on('error', reject)
      .connect(opts);
  });
}

(async () => {
  const { opts, deployDir } = sshConnect();
  const cmds = [
    `cd ${deployDir} && docker compose -f docker-compose.prod.yml --env-file .env.prod ps`,
    `cd ${deployDir} && docker compose -f docker-compose.prod.yml --env-file .env.prod logs --tail=40 frontend`,
    `cd ${deployDir} && docker compose -f docker-compose.prod.yml --env-file .env.prod logs --tail=40 backend`,
    `grep -E "^(FRONTEND_URL|VITE_API_URL|VITE_EMPRESA_ID|BILLING_ENABLED)=" ${deployDir}/.env.prod | sed "s/=.*/=***REDACTED***/"`,
    'docker exec syscontabel-frontend wget -qO- http://localhost/ 2>&1 | head -5',
  ];
  for (const cmd of cmds) {
    console.log('\n=== ' + cmd.split('&&').pop().trim() + ' ===');
    const r = await run(cmd, { opts });
    console.log(r.out);
  }
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
