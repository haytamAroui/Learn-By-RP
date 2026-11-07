/* Local design-reference behavior. No account, recording or progress data. */
const root = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const textToggle = document.getElementById('text-toggle');
const tokenSearch = document.getElementById('token-search');
const tokenData = window.LINGO_TOKENS;
const originalReference = document.getElementById('original-reference');

function syncReferenceTheme() {
  const document = originalReference?.contentDocument;
  if (document?.documentElement) document.documentElement.dataset.theme = root.dataset.theme;
}
originalReference?.addEventListener('load', syncReferenceTheme);

function icon(name) {
  return `<svg class="icon" aria-hidden="true"><use href="#${name}"/></svg>`;
}

function paintTokens() {
  if (!tokenData) return;
  const theme = root.dataset.theme;
  const entries = Object.entries({ ...tokenData.foundation, ...tokenData[theme] });
  const query = tokenSearch.value.trim().toLowerCase();
  const filtered = entries.filter(([name, value]) => `${name} ${value}`.toLowerCase().includes(query));
  const list = document.getElementById('token-list');
  list.replaceChildren(...filtered.map(([name, value]) => {
    const row = document.createElement('div');
    row.className = 'token-row';
    const code = document.createElement('code');
    code.textContent = `--${name}`;
    const detail = document.createElement('span');
    detail.textContent = value;
    row.append(code, detail);
    return row;
  }));
  document.getElementById('token-count').textContent = `${filtered.length} of ${entries.length} tokens`;
  document.getElementById('theme-caption').textContent = `${theme === 'dark' ? 'Dark' : 'Light'} semantic values`;
  document.getElementById('activity-palette').innerHTML = [
    ['speaking', 'Speaking', 'mic'], ['listening', 'Listening', 'headphones'],
    ['vocabulary', 'Vocabulary', 'book'], ['grammar', 'Grammar', 'pattern']
  ].map(([name, title, symbol]) => `<div class="color-card activity ${name}"><div class="color-sample">${icon(symbol)}<span class="color-dot"></span></div><div class="color-info"><strong>${title}</strong><code>--${name}</code><code>${resolveToken(name)}</code></div></div>`).join('');
}

function resolveToken(name) {
  const value = tokenData[root.dataset.theme][name];
  const alias = /^var\(--(.+)\)$/.exec(value);
  return alias ? tokenData.foundation[alias[1]] : value;
}

themeToggle.addEventListener('click', () => {
  const dark = root.dataset.theme !== 'dark';
  root.dataset.theme = dark ? 'dark' : 'light';
  root.style.colorScheme = dark ? 'dark' : 'light';
  themeToggle.setAttribute('aria-pressed', String(dark));
  themeToggle.querySelector('span').textContent = dark ? 'Light preview' : 'Dark preview';
  syncReferenceTheme();
  paintTokens();
});

textToggle.addEventListener('click', () => {
  const large = textToggle.getAttribute('aria-pressed') !== 'true';
  textToggle.setAttribute('aria-pressed', String(large));
  root.style.fontSize = large ? '125%' : '';
});

const form = document.getElementById('exercise-form');
const check = document.getElementById('check-answer');
const feedback = document.getElementById('answer-feedback');
form.addEventListener('change', () => {
  check.disabled = false;
  feedback.hidden = true;
});
form.addEventListener('submit', event => {
  event.preventDefault();
  const answer = new FormData(form).get('answer');
  if (!answer) return;
  const correct = answer === 'voudrais';
  feedback.dataset.kind = correct ? 'correct' : 'retry';
  feedback.innerHTML = correct
    ? `${icon('check')}<div><strong>That’s right.</strong><span lang="fr">Je voudrais</span> means “I would like”. Use it to make a polite request.</div>`
    : `${icon('info')}<div><strong>Try another word.</strong>You’re asking politely for something. Which word means “would like”?</div>`;
  feedback.hidden = false;
  feedback.scrollIntoView({ block: 'nearest', behavior: 'instant' });
});

tokenSearch.addEventListener('input', paintTokens);
paintTokens();
