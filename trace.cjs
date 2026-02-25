const fs = require('fs');
const lines = fs.readFileSync('components/BookingModal.tsx', 'utf8').split('\n');
let open = 0;
lines.forEach((line, i) => {
    // simpler match
    let o = 0;
    let c = 0;
    let str = line;
    while (str.includes('<div')) { o++; str = str.replace('<div', ''); }
    let str2 = line;
    while (str2.includes('</div')) { c++; str2 = str2.replace('</div', ''); }
    open += (o - c);
    if (o > 0 || c > 0) {
        console.log(`${i + 1}: +${o} -${c} => ${open}`);
    }
});
