
import fs from 'fs';

const content = fs.readFileSync('c:/Users/liuxs/Documents/Staycation-template/components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

let tagStack = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Very simple tag matcher
    const openTags = [...line.matchAll(/<([a-zA-Z0-9]+)(\s|>)/g)];
    const closeTags = [...line.matchAll(/<\/([a-zA-Z0-9]+)>/g)];
    const selfClosing = [...line.matchAll(/<([a-zA-Z0-9]+)[^>]*\/>/g)];

    // Sort tags by position on the line
    let events = [];
    openTags.forEach(m => events.push({ type: 'open', name: m[1], pos: m.index, line: i + 1 }));
    closeTags.forEach(m => events.push({ type: 'close', name: m[1], pos: m.index, line: i + 1 }));
    selfClosing.forEach(m => events.push({ type: 'self', name: m[1], pos: m.index, line: i + 1 }));
    
    events.sort((a, b) => a.pos - b.pos);

    for (const e of events) {
        if (e.type === 'open') tagStack.push({ name: e.name, line: e.line });
        else if (e.type === 'close') {
            const last = tagStack.pop();
            if (last && last.name !== e.name) {
                // console.log(`Tag mismatch: opened ${last.name} at ${last.line}, closed ${e.name} at ${e.line}`);
            }
        }
    }
    
    if (i + 1 > 2101 && tagStack.length === 0) {
        // console.log(`Tag stack reached 0 at line ${i + 1}`);
    }
}

// Check tag stack at line 3093
tagStack = [];
for (let i = 0; i < 3093; i++) {
    const line = lines[i];
    const openTags = [...line.matchAll(/<([a-zA-Z0-9]+)(\s|>)/g)];
    const closeTags = [...line.matchAll(/<\/([a-zA-Z0-9]+)>/g)];
    const selfClosing = [...line.matchAll(/<([a-zA-Z0-9]+)[^>]*\/>/g)];

    let events = [];
    openTags.forEach(m => events.push({ type: 'open', name: m[1], pos: m.index, line: i + 1 }));
    closeTags.forEach(m => events.push({ type: 'close', name: m[1], pos: m.index, line: i + 1 }));
    selfClosing.forEach(m => events.push({ type: 'self', name: m[1], pos: m.index, line: i + 1 }));
    
    events.sort((a, b) => a.pos - b.pos);

    for (const e of events) {
        if (e.type === 'open') tagStack.push({ name: e.name, line: e.line });
        else if (e.type === 'close') tagStack.pop();
    }
}
console.log(`Tag stack at line 3093 length: ${tagStack.length}`);
if (tagStack.length > 0) {
    console.log(`Last open tag: ${tagStack[tagStack.length - 1].name} from line ${tagStack[tagStack.length - 1].line}`);
}
