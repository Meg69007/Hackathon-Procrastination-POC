import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dir, '../dist/index.html');

const MANIFEST_LINK = '<link rel="manifest" href="/manifest.json" />';
const APPLE_ICON    = '<link rel="apple-touch-icon" href="/icon-192.png" />';
const LANG_FR       = 'lang="fr"';
const META_VIEWPORT = 'content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"';
const APPLE_CAPABLE = '<meta name="mobile-web-app-capable" content="yes" />\n<meta name="apple-mobile-web-app-capable" content="yes" />\n<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />\n<meta name="apple-mobile-web-app-title" content="LaFlemme" />';

const SW_SCRIPT = `<script>
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
}
</script>`;

let html = readFileSync(htmlPath, 'utf8');

// Fix lang attribute
html = html.replace('lang="en"', LANG_FR);

// Fix viewport to be mobile-optimised
html = html.replace(
  'content="width=device-width, initial-scale=1, shrink-to-fit=no"',
  'content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"'
);

// Inject manifest + apple icon before </head>
if (!html.includes('rel="manifest"')) {
  html = html.replace('</head>', `${MANIFEST_LINK}\n${APPLE_ICON}\n${APPLE_CAPABLE}\n</head>`);
}

// Inject SW registration before </body>
if (!html.includes('serviceWorker')) {
  html = html.replace('</body>', `${SW_SCRIPT}\n</body>`);
}

writeFileSync(htmlPath, html, 'utf8');
console.log('PWA injection done ✓');
