import {readFile,writeFile,mkdir,readdir,unlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const base=new URL('../docs/design-2026-10-10/exports/lingo-studio-package/',import.meta.url);
const assets=new URL('assets/fonts/',base);
await mkdir(assets,{recursive:true});
for(const file of await readdir(assets))if(/^[a-f0-9]{16}\.(woff2|woff|ttf)$/.test(file))await unlink(new URL(file,assets));
let html=await readFile(new URL('../docs/design-2026-10-10/lingo-ux-studio-v5.html',import.meta.url),'utf8');
const sheets=[...new Set([...html.matchAll(/<link\b[^>]*href="(https:\/\/fonts\.googleapis\.com\/css2[^\"]+)"[^>]*>/g)].map(match=>match[1].replaceAll('&amp;','&')))];
const files=new Map();
const get=async url=>{const response=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 Chrome/130.0.0.0 Safari/537.36'}});if(!response.ok)throw new Error(`Download failed: ${response.status} ${url}`);return response;};
let css='/* Bundled Google Fonts: original font-face declarations and unicode ranges. */\n';
for(const url of sheets){let sheet=await(await get(url)).text();const urls=[...new Set([...sheet.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(match=>match[1]))];
  await Promise.all(urls.map(async fontUrl=>{if(files.has(fontUrl))return;const extension=new URL(fontUrl).pathname.match(/\.(woff2|woff|ttf)$/)?.[0];if(!extension)throw new Error('Unexpected font format');const name=createHash('sha256').update(fontUrl).digest('hex').slice(0,16)+extension;files.set(fontUrl,name);await writeFile(new URL(name,assets),new Uint8Array(await(await get(fontUrl)).arrayBuffer()));}));
  for(const fontUrl of urls)sheet=sheet.replaceAll(fontUrl,files.get(fontUrl));css+=sheet+'\n';
}
html=html.replace(/<link\b[^>]*href="https:\/\/fonts\.(googleapis|gstatic)\.com[^\"]*"[^>]*\/?\s*>/g,'');
html=html.replace('</head>','<link rel="stylesheet" href="assets/fonts/fonts.css"></head>');
await writeFile(new URL('fonts.css',assets),css);
await writeFile(new URL('index.html',base),html);
await writeFile(new URL('README.txt',base),`LINGO UX EXPERIENCE STUDIO — COMPLETE PACKAGE\n\n1. Extract the entire ZIP to a folder.\n2. Open index.html in Chrome, Edge, Firefox or Safari.\n3. Use the screen library or screen board to explore all 142 screens.\n4. Use the palette bar for Warm / Warm Midnight and the five color palettes.\n\nKeep the assets folder beside index.html. Fonts, artwork, styling and scripts\nare included. The package needs no installation or internet connection.\n\nThis is an interactive design prototype. Accounts, subscriptions, progress and\nlearning content are examples. Recording and playback are visual simulations.\n\nGoogle Fonts are bundled from fonts.googleapis.com / fonts.gstatic.com.\nFraunces, DM Sans, Figtree and Bricolage Grotesque use the SIL Open Font License.\nSee FONT-LICENSES.txt for their licenses and upstream attribution.\n`);
const licenses=[['Fraunces','fraunces'],['DM Sans','dmsans'],['Figtree','figtree'],['Bricolage Grotesque','bricolagegrotesque']];
let licenseText='Bundled font license notices, retrieved from the Google Fonts repository.\n\n';
for(const [label,slug]of licenses){const url=`https://raw.githubusercontent.com/google/fonts/main/ofl/${slug}/OFL.txt`;licenseText+=`===== ${label} =====\nUpstream: ${url}\n\n${await(await get(url)).text()}\n\n`;}
await writeFile(new URL('FONT-LICENSES.txt',base),licenseText);
for(const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g))if(!match[1].includes('application/json'))new Function(match[2]);
console.log(JSON.stringify({folder:base.pathname,fontFiles:files.size,htmlBytes:Buffer.byteLength(html),fontStylesheets:sheets.length}));
