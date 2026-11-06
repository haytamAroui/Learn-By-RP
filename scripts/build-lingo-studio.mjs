import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const sourcePath = new URL('./lingo-studio/atelier-source.html', import.meta.url);
const outputPath = new URL('../docs/design-2026-10-10/lingo-ux-studio-v5.html', import.meta.url);
const source = await readFile(sourcePath, 'utf8');
let html = source;
let controller = source.match(/<script id="lingo-studio-js">([\s\S]*?)<\/script>/)?.[1];
if (!controller) throw new Error('The source Studio controller was not found.');
const replace = (needle, replacement) => {
  if (!controller.includes(needle)) throw new Error(`Studio seam changed: ${needle.slice(0, 100)}`);
  controller = controller.replace(needle, replacement);
};
replace("function renderContent(id){let s=routeMap.get(id);if(!s)return '';", "function renderContent(id){let s=routeMap.get(id);if(!s)return '';const refined=window.LingoV5.content(id,{screen:s,messages});if(refined!==undefined)return refined;");
replace("const showNav=!['start','premium','states'].includes(s.group);", "const showNav=!['start','premium','states'].includes(s.group);");
replace('${showNav?bottomNav(s):\'\'}</div>', '${window.LingoV5.fixedActions(s)}${showNav?window.LingoV5.nav(s):\'\'}</div>');
replace("$('active-scroll')?.scrollTo(0,0);", "window.LingoV5.decorate(s);$('active-scroll')?.scrollTo(0,0);");
replace('function navigate(id,addHistory=true){if(!routeMap.has(id))return;', 'function navigate(id,addHistory=true){if(!routeMap.has(id))return;window.LingoV5.beforeNavigate();');
replace('${renderContent(s.id).replace(/\\sid="[^\"]*"/g,\'\')}', '${window.LingoV5.boardMarkup(renderContent(s.id),s)}');
replace('<div class="mini-ui">', '<div class="mini-ui" inert>');
replace("if(el.dataset.go==='choice-feedback'", "if(el.closest('.studio-device')&&el.dataset.go==='choice-feedback'");
replace("if(el.dataset.go==='gap-feedback')", "if(el.closest('.studio-device')&&el.dataset.go==='gap-feedback')");
replace("if(el.dataset.go==='listening-feedback'", "if(el.closest('.studio-device')&&el.dataset.go==='listening-feedback'");
replace("el=e.target.closest('[data-say]');if(el){if(!('speechSynthesis' in window)){toast('Speech synthesis is unavailable here');return}const u=new SpeechSynthesisUtterance(el.dataset.say);u.lang=el.dataset.lang||'fr-FR';u.rate=.87;speechSynthesis.cancel();speechSynthesis.speak(u);return}", "el=e.target.closest('[data-say]');if(el){toast('Playback state preview — no audio is played.');return}");
replace("if(act==='theme'){theme=theme==='light'?'dark':'light';", "if(act==='theme'){theme=current==='appearance'&&['light','dark'].includes(choice[current])?choice[current]:theme==='light'?'dark':'light';");
replace("if(e.key==='Enter'&&e.target.closest('.board-item'))", "if((e.key==='Enter'||e.key===' ')&&e.target.closest('.board-item'))");
replace("theme='light',board=false", "theme=new URLSearchParams(location.search).get('theme')==='dark'?'dark':'light',board=false");
replace("const hash=decodeURIComponent(location.hash.replace('#',''));", "let hash='';try{hash=decodeURIComponent(location.hash.replace('#',''))}catch{hash='home'};");
replace('window.LingoStudio={screens,collections,navigate,showBoard:()=>{if(!board)toggleBoard()},count:screens.length};', 'window.LingoStudio={screens,collections,navigate,refresh:render,current:()=>current,toast,setTheme:name=>{if(!["light","dark"].includes(name))return;theme=name;studio.dataset.theme=name},showBoard:()=>{if(!board)toggleBoard()},count:screens.length};window.LingoV5.boot();');

// Original reference scripts and the stacked experimental layer are not part of
// the new prototype. The retained controller owns only in-page Studio behavior.
html = html.replace(/<script([^>]*)>[\s\S]*?<\/script>/g, (_, attributes) => attributes.includes('id="lingo-studio-js"') ? '<!-- STUDIO_CONTROLLER -->' : '');
html = html.replace(/<style([^>]*)>([\s\S]*?)<\/style>/g, (block, attributes, css) => {
  if (attributes.includes('warm-midnight-v2') || /realism layer|@property --lxp|lx-focus|\.lx-out|\.lx-pro|Lingo V5:|\.round\.sw/.test(css)) return '';
  return block;
});
const tokens = await readFile(new URL('../src/design/tokens.ts', import.meta.url), 'utf8');
const palette = {};
for (const match of tokens.matchAll(/export const (LIGHT|DARK) = \{([\s\S]*?)\} as const/g)) {
  palette[match[1].toLowerCase()] = Object.fromEntries([...match[2].matchAll(/^\s+(\w+): '(#[0-9a-fA-F]{6})',/gm)].map(item => [item[1], item[2]]));
}
if (!palette.light?.canvas || !palette.dark?.canvas) throw new Error('Canonical themes are missing.');
const vectors = await readFile(new URL('../src/design/lingoArtwork.ts', import.meta.url), 'utf8');
const artwork = JSON.parse(vectors.slice(vectors.indexOf('{'), vectors.lastIndexOf('}') + 1).replace(/,\s*}/g, '}'));
const css = await readFile(new URL('./lingo-studio/refinement.css', import.meta.url), 'utf8');
const adapter = await readFile(new URL('./lingo-studio/refinement.js', import.meta.url), 'utf8');
const data = JSON.stringify({palette, artwork}).replace(/</g, '\\u003c');
html = html.replace('<title>Lingo Atelier 2027 — Premium Language Learning Experience</title>', '<title>Lingo UX Experience Studio — Original 3 refined · 142 screens</title>');
html = html.replace('</head>', '<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=DM+Sans:wght@400;500;600;700;800&family=Figtree:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap" rel="stylesheet"><style id="lingo-v5-refinement">'+css+'</style></head>');
html = html.replace('<!-- STUDIO_CONTROLLER -->', '<script id="lingo-v5-data" type="application/json">'+data+'</script><script id="lingo-v5-adapter">'+adapter+'</script><script id="lingo-studio-js">'+controller+'</script>');
for (const match of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
  if (!match[1].includes('application/json')) new Function(match[2]);
}
await mkdir(new URL('../docs/design-2026-10-10/', import.meta.url), {recursive:true});
await writeFile(outputPath, html);
await writeFile(new URL('../docs/design-2026-10-10/STUDIO_BUILD.json', import.meta.url), JSON.stringify({source:'scripts/lingo-studio/atelier-source.html',sourceSha256:createHash('sha256').update(source).digest('hex'),output:'docs/design-2026-10-10/lingo-ux-studio-v5.html',outputBytes:Buffer.byteLength(html),expectedScreens:142,canonicalColors:'src/design/tokens.ts',canonicalArtwork:'src/design/lingoArtwork.ts'},null,2)+'\n');
console.log(`Built the 142-screen Lingo Studio: ${outputPath.pathname}`);
