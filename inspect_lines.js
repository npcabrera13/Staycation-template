
import fs from 'fs';

const content = fs.readFileSync('c:/Users/liuxs/Documents/Staycation-template/components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

for (let i = 3085; i < 3095; i++) {
    const line = lines[i];
    if (line !== undefined) {
        console.log(`${i + 1}: ${JSON.stringify(line)}`);
    }
}
