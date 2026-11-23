import { spawn } from 'node:child_process';

export function iniciarNgrok(port) {
  const ngrok = spawn('ngrok', ['http', String(port)], { stdio: 'ignore' });
  ngrok.on('error', () => console.error('Não foi possível iniciar o ngrok. Ele está instalado?'));

  process.on('SIGINT', () => process.exit());
  process.on('exit', () => ngrok.kill());

  let tentativas = 0;
  const buscarLink = setInterval(async () => {
    tentativas++;
    try {
      const res = await fetch('http://127.0.0.1:4040/api/tunnels');
      const { tunnels } = await res.json();
      if (tunnels.length) {
        clearInterval(buscarLink);
        console.log(`Link público (ngrok): ${tunnels[0].public_url}`);
      }
    } catch {}
    if (tentativas >= 15) {
      clearInterval(buscarLink);
      console.error('O ngrok não respondeu. Rode "ngrok http ' + port + '" para ver o erro.');
    }
  }, 1000);
}
