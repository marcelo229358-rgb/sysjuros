const { Client } = require('ssh2');

const script = `set -e
cd /root/sysjuros
git pull origin main

if [ ! -f evolution.env ]; then cp evolution.env.example evolution.env; fi

touch .env.prod
grep -q '^MASTER_EMAIL=' .env.prod || echo 'MASTER_EMAIL=marcelo229358@gmail.com' >> .env.prod
grep -q '^MASTER_PASSWORD=' .env.prod || echo 'MASTER_PASSWORD=motogp1020' >> .env.prod
grep -q '^NOTIFICACAO_DIAS_ANTECEDENCIA=' .env.prod || echo 'NOTIFICACAO_DIAS_ANTECEDENCIA=1' >> .env.prod
grep -q '^EVOLUTION_API_URL=' .env.prod || echo 'EVOLUTION_API_URL=http://syscontabel-evolution-api:8080' >> .env.prod
grep -q '^EVOLUTION_API_KEY=' .env.prod || echo 'EVOLUTION_API_KEY=syscontabel-evolution-key-change-me' >> .env.prod
grep -q '^EVOLUTION_INSTANCE=' .env.prod || echo 'EVOLUTION_INSTANCE=syscontabel' >> .env.prod
sed -i 's/^MASTER_EMAIL=.*/MASTER_EMAIL=marcelo229358@gmail.com/' .env.prod || true
sed -i 's/^MASTER_PASSWORD=.*/MASTER_PASSWORD=motogp1020/' .env.prod || true
sed -i 's|^EVOLUTION_API_URL=.*|EVOLUTION_API_URL=http://syscontabel-evolution-api:8080|' .env.prod || true
sed -i 's/^EVOLUTION_INSTANCE=.*/EVOLUTION_INSTANCE=syscontabel/' .env.prod || true

sed -i 's/sysjuros-evolution-key/syscontabel-evolution-key/g' evolution.env 2>/dev/null || true
sed -i 's/EVOLUTION_INSTANCE=sysjuros/EVOLUTION_INSTANCE=syscontabel/' evolution.env 2>/dev/null || true

docker compose -f docker-compose.evolution.yml --env-file evolution.env up -d
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

docker ps --format 'table {{.Names}}\\t{{.Status}}' | head -20
`;

const conn = new Client();
conn
  .on('ready', () => {
    conn.exec(script, (err, stream) => {
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
  .connect({
    host: '157.173.119.168',
    port: 22,
    username: 'root',
    password: 'Motogp1020@',
    readyTimeout: 30000,
  });
