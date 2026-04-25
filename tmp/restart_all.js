const { execSync } = require('child_process');

const ports = [3000, 3001, 5000, 5005, 5173];

console.log('🛑 Killing stale processes...');
ports.forEach(port => {
    try {
        const stdout = execSync(`netstat -ano | findstr :${port}`).toString();
        const pids = new Set(stdout.split('\n')
            .map(line => line.trim().split(/\s+/).pop())
            .filter(pid => pid && pid !== '0' && pid !== 'Id'));
        
        pids.forEach(pid => {
            try {
                process.kill(pid, 'SIGKILL');
                console.log(`✅ Killed PID ${pid} on port ${port}`);
            } catch (e) {}
        });
    } catch (e) {}
});

console.log('🚀 Starting Servers...');
// Backend on 5000 (standard for the app)
const backend = require('child_process').spawn('npm', ['start'], {
    cwd: 'c:\\Users\\Admin\\Desktop\\HighPhaus\\server',
    detached: true,
    stdio: 'ignore',
    shell: true
});
backend.unref();
console.log('✅ Backend started (detached)');

// Slook on 3000
const slook = require('child_process').spawn('npm', ['run', 'dev'], {
    cwd: 'c:\\Users\\Admin\\Desktop\\HighPhaus\\slook',
    detached: true,
    stdio: 'ignore',
    shell: true
});
slook.unref();
console.log('✅ Slook started (detached)');

// Client on 5173
const client = require('child_process').spawn('npm', ['run', 'dev'], {
    cwd: 'c:\\Users\\Admin\\Desktop\\HighPhaus\\client',
    detached: true,
    stdio: 'ignore',
    shell: true
});
client.unref();
console.log('✅ Client started (detached)');

setTimeout(() => {
    process.exit(0);
}, 2000);
