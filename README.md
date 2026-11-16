# Criterion Partners

The website for Criterion Partners, an EB-1A profile building consultancy.

Plain HTML, CSS and a little JavaScript. No framework and no build step on the host:
the `.html` files in this repo are exactly what is served.

## Pages

```
index.html            home
services.html         the ten services and pricing
peer-review.html      gallery of client reviewer certificates (names blurred)
articles.html         news and education hub
articles/*.html       one page per article
about.html            the firm and its founder
contact.html          WhatsApp, email, common questions
assets/               stylesheet, script, images
src/                  the source the pages are generated from
```

## Changing the site

Do not edit the `.html` files by hand. They are generated. Edit the source in `src/`
and run:

```bash
node src/build.js
```

- **Add an article:** copy any file in `src/articles/`, change the lines at the top
  (slug, title, type `news` or `education`, date, minutes, summary) and the text, then
  run the build. It appears on the Articles page automatically.
- **Change wording on a page:** edit `src/build.js`.
- **Change colours or layout:** `src/base.css` (colour tokens are at the top) and `src/extra.css`.

## Preview locally

```bash
npx http-server -p 8123
```

## Hosting

GitHub Pages serves the `main` branch from the repository root. Push to `main` and the
live site updates within a minute or two.
