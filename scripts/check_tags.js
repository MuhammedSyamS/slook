
const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\Admin\\Desktop\\HighPhaus\\client\\src\\components\\Navbar.jsx', 'utf8');

let divOpen = 0;
let divClose = 0;
let navOpen = 0;
let navClose = 0;

const lines = content.split('\n');
lines.forEach((line, i) => {
    const dO = (line.match(/<div/g) || []).length;
    const dC = (line.match(/<\/div/g) || []).length;
    const nO = (line.match(/<nav/g) || []).length;
    const nC = (line.match(/<\/nav/g) || []).length;

    divOpen += dO;
    divClose += dC;
    navOpen += nO;
    navClose += nC;

    if (i + 1 >= 1 && (dO > 0 || dC > 0 || nO > 0 || nC > 0)) {
        fs.appendFileSync('c:\\Users\\Admin\\Desktop\\HighPhaus\\scripts\\tags_log.txt', `Line ${i + 1}: dO=${dO} dC=${dC} nO=${nO} nC=${nC} | Balance: div=${divOpen - divClose} nav=${navOpen - navClose}\n`);
    }
});

fs.appendFileSync('c:\\Users\\Admin\\Desktop\\HighPhaus\\scripts\\tags_log.txt', `Final Counts: DIV=${divOpen - divClose}, NAV=${navOpen - navClose}\n`);
