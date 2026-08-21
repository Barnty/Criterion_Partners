# Criterion Partners

The website for Criterion Partners, an EB-1A profile building consultancy.

Live at **https://criterionpartners.net**

## What this is

Plain HTML, CSS and vanilla JavaScript. No framework, no build step, no npm install.
The whole site is nine files. What is in the repo is exactly what is served.

```
index.html          the entire page
assets/site.css     all styling
assets/site.js      all behaviour
assets/*.mp4|jpg    the hero video and photography
CNAME               the custom domain for GitHub Pages
```

## Running it locally

The hero video is fetched with `fetch()`, which browsers block on `file://` URLs.
Double-clicking `index.html` therefore shows the designed still-image hero, which is
the intended fallback, not a bug. To see the scroll-driven video you need any local
server:

```bash
npx http-server -p 8123
```

Then open http://localhost:8123

## Editing it

Copy lives in `index.html`. Colours are CSS custom properties at the top of
`assets/site.css`, sampled from the brand logo. The hero caption timings are the
`data-a` and `data-b` attributes on each `.band` element, expressed as scroll
progress from 0 to 1.

## Deploying

GitHub Pages serves the `main` branch from the repository root. Push to `main` and
the live site updates within a minute or two.
