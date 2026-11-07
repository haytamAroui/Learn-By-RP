# Lingo design foundation v1

Open `index.html` directly, or visit `/design-system/` on the package's HTTP server.
The complete preview works offline with bundled fonts and original illustrations.

- `tokens.json`: canonical token source (foundation + light/dark semantic roles).
- `tokens.css`: generated CSS variables, ready to import.
- `tokens-data.js`: generated preview data; allows the token browser to work offline.
- `originals.html`: generated gallery using the actual Original 3 markup.
- `originals.generated.css`: source styles mapped to `original-*` component tokens.
- `originals-adapter.css`: source aliases, frozen animations, dark extension and mobile stacking.
- `components.css`: documentation and separate exercise extension.
- `preview.js`: theme/text preview, token search and local exercise feedback.
- `../DESIGN.md`: reference decisions, token ownership and adoption rules.

After editing `tokens.json`, run:

```powershell
python design-system/build.py
python design-system/validate.py
```

The source uses CSS strings and aliases, not the DTCG interchange schema. Import
`tokens.css` for CSS consumers; adapt the JSON for another platform as needed.
Light is the initial preview. Dark uses the same semantic roles. The preview's
Token text setting scales the documentation, retaining the source gallery's
original proportions. Neither setting changes stored learner preferences.

Illustrations are extracted by `build.py` from this package's Original 3 artwork.
Fonts remain in the parent package's `assets/fonts`; retain that folder and the
package's FONT-LICENSES.txt when sharing the reference.

This implements the token foundation and representative components. Adoption
across the 142 existing Studio screens remains separate work.
