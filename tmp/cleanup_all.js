const { exec } = require('child_process');

const ports = [3000, 3001, 5000, 5002, 5005, 5173];

async function cleanup() {
    for (const port of ports) {
        console.log(`🔍 Checking port ${port}...`);
        const checkCmd = process.platform === 'win32'
            ? `netstat -ano | findstr :${port}`
            : `lsof -i :${port} -t`;

        await new Promise((resolve) => {
            exec(checkCmd, (err, stdout, stderr) => {
                if (!stdout) {
                    console.log(`✅ Port ${port} is free.`);
                    return resolve();
                }

                const lines = stdout.trim().split('\n');
                const pids = new Set();
                lines.forEach(line => {
                    const parts = line.trim().split(/\s+/);
                    const pid = process.platform === 'win32' ? parts[parts.length - 1] : parts[0];
                    if (pid && !isNaN(pid) && pid !== '0') pids.add(pid);
                });

                if (pids.size === 0) {
                    return resolve();
                }

                console.log(`⚠️ Killing PIDs for port ${port}: ${Array.from(pids).join(', ')}`);
                let completed = 0;
                pids.forEach(pid => {
                    const killCmd = process.platform === 'win32' ? `taskkill /F /PID ${pid}` : `kill -9 ${pid}`;
                    exec(killCmd, () => {
                        completed++;
                        if (completed === pids.size) resolve();
                    });
                });
            });
        });
    }
    console.log('✨ All ports cleared.');
}

cleanup();
