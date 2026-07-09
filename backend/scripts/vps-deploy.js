/**
 * Deploy remoto na VPS via SSH.
 *
 * Variáveis obrigatórias (defina em vps.env.local — NÃO commitar):
 *   VPS_HOST, VPS_USER
 *   VPS_SSH_KEY_PATH  (recomendado)  OU  VPS_PASSWORD
 *
 * Uso:
 *   cp backend/scripts/vps.env.example backend/scripts/vps.env.local
 *   # preencher vps.env.local
 *   node backend/scripts/vps-deploy.js
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
    console.log(`[vps-deploy] Config carregada: ${file}`);
    break;
  }
}

function requireEnv(name) {
  const val = process.env[name];
  if (!val) {
    console.error(`[vps-deploy] Variável obrigatória ausente: ${name}`);
    console.error('Copie backend/scripts/vps.env.example para vps.env.local e preencha.');
    process.exit(1);
  }
  return val;
}

loadEnvFile();

const host = requireEnv('VPS_HOST');
const username = requireEnv('VPS_USER');
const port = Number(process.env.VPS_PORT || 22);
const keyPath = process.env.VPS_SSH_KEY_PATH;
const password = process.env.VPS_PASSWORD;
const deployDir = process.env.VPS_DEPLOY_DIR || '/root/sysjuros';

if (!keyPath && !password) {
  console.error('[vps-deploy] Defina VPS_SSH_KEY_PATH (recomendado) ou VPS_PASSWORD.');
  process.exit(1);
}

const remoteScript = `set -e
cd ${deployDir}
git pull origin main

if [ ! -f evolution.env ]; then cp evolution.env.example evolution.env; fi

if [ ! -f .env.prod ]; then
  echo "ERRO: .env.prod não encontrado em ${deployDir}. Crie manualmente na VPS." >&2
  exit 1
fi

for var in MASTER_EMAIL MASTER_PASSWORD JWT_SECRET DATABASE_URL FRONTEND_URL; do
  if ! grep -q "^\${var}=" .env.prod 2>/dev/null; then
    echo "AVISO: \${var} ausente em .env.prod" >&2
  fi
done

sed -i 's/sysjuros-evolution-key/syscontabel-evolution-key/g' evolution.env 2>/dev/null || true
sed -i 's/EVOLUTION_INSTANCE=sysjuros/EVOLUTION_INSTANCE=syscontabel/' evolution.env 2>/dev/null || true

docker compose -f docker-compose.evolution.yml --env-file evolution.env up -d
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

docker ps --format 'table {{.Names}}\\t{{.Status}}' | head -20
`;

const connectOpts = { host, port, username, readyTimeout: 30000 };
if (keyPath) {
  connectOpts.privateKey = fs.readFileSync(keyPath);
  if (process.env.VPS_SSH_PASSPHRASE) {
    connectOpts.passphrase = process.env.VPS_SSH_PASSPHRASE;
  }
} else {
  connectOpts.password = password;
}

const conn = new Client();
conn
  .on('ready', () => {
    conn.exec(remoteScript, (err, stream) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      let out = '';
      stream
        .on('close', (code) => {
          process.stdout.write(out);
          process.exit(code ?? 0);
        })
        .on('data', (d) => {
          out += d;
        })
        .stderr.on('data', (d) => {
          out += d;
        });
    });
  })
  .on('error', (e) => {
    console.error('SSH:', e.message);
    process.exit(1);
  })
  .connect(connectOpts);
