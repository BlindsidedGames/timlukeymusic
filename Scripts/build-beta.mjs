import { copyFile, cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, '..');
const output = path.join(root, 'dist');

const rootFiles = [
    'index.html',
    'producer.html',
    'guitarist.html',
    'arranger.html',
    'composer.html',
    'songwriter.html',
    'gig.html',
    'teaching.html',
    'testimonials.html',
    'contact.html',
    'modern.css',
    '_headers',
    'robots.txt',
    'sitemap.xml'
];

await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, 'Scripts'), { recursive: true });

await Promise.all(rootFiles.map(function (file) {
    return copyFile(path.join(root, file), path.join(output, file));
}));

await copyFile(path.join(root, 'Scripts', 'site.js'), path.join(output, 'Scripts', 'site.js'));
await cp(path.join(root, 'img'), path.join(output, 'img'), { recursive: true });
await cp(path.join(root, 'Files'), path.join(output, 'Files'), { recursive: true });

console.log('Prepared Cloudflare Pages output in dist/.');
