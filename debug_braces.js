
import fs from 'fs';

const content = fs.readFileSync('c:/Users/liuxs/Documents/Staycation-template/components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

let braceStack = [];
let parenStack = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '{') braceStack.push(i + 1);
        else if (char === '}') braceStack.pop();
        else if (char === '(') parenStack.push(i + 1);
        else if (char === ')') parenStack.pop();
        
        if (i + 1 >= 2101 && parenStack.length === 1 && char === ')') {
             // We pushed at 2101, so when it pops and returns to length 0 or something...
             // Wait, parenStack.length would be 0 if it closes.
        }
        
        if (i + 1 > 2101 && parenStack.length === 0) {
             console.log(`Paren stack reached 0 at line ${i + 1}, col ${j + 1}`);
        }
    }
}
