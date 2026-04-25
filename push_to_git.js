const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repos = [
    {
        name: 'slook',
        url: 'https://github.com/MuhammedSyamS/E-commerce-2-frontend.git',
        dir: path.resolve(__dirname, 'slook'),
        commit: 'Sync SLOOK frontend to legacy repository'
    },
    {
        name: 'server',
        url: 'https://github.com/MuhammedSyamS/E-commerce-2-Backend.git',
        dir: path.resolve(__dirname, 'server'),
        commit: 'Fix Express 5 wildcard routing crash for production stability'
    }
];

const tempDir = path.resolve(__dirname, 'temp_push');
if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir);

repos.forEach(repo => {
    console.log(`Processing ${repo.name}...`);
    const targetPath = path.join(tempDir, repo.name);
    
    // Clone
    console.log(`Cloning ${repo.url}...`);
    execSync(`git clone ${repo.url} ${targetPath}`, { stdio: 'inherit' });
    
    // Delete everything except .git
    console.log(`Cleaning ${repo.name}...`);
    const files = fs.readdirSync(targetPath);
    files.forEach(file => {
        if (file === '.git') return;
        fs.rmSync(path.join(targetPath, file), { recursive: true, force: true });
    });
    
    // Copy new files (excluding .git and node_modules)
    console.log(`Copying files for ${repo.name}...`);
    const sourceFiles = fs.readdirSync(repo.dir);
    sourceFiles.forEach(file => {
        if (file === '.git' || file === 'node_modules') return;
        const src = path.join(repo.dir, file);
        const dst = path.join(targetPath, file);
        if (fs.lstatSync(src).isDirectory()) {
            // Simple recursive copy
            copyDir(src, dst);
        } else {
            fs.copyFileSync(src, dst);
        }
    });
    
    // Commit and Push
    console.log(`Pushing ${repo.name}...`);
    execSync(`git add .`, { cwd: targetPath, stdio: 'inherit' });
    try {
        execSync(`git commit -m "${repo.commit}"`, { cwd: targetPath, stdio: 'inherit' });
    } catch (e) {
        console.log("Nothing to commit.");
    }
    execSync(`git push origin main`, { cwd: targetPath, stdio: 'inherit' });
});

function copyDir(src, dest) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name === '.git') continue;
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

console.log("Cleanup...");
fs.rmSync(tempDir, { recursive: true, force: true });
console.log("Done!");
