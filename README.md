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
vercel.json         hosting config: static output, cache headers
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

Vercel serves this repository as a static site. There is no build step: `vercel.json`
sets the output directory to the repository root, so what is committed is what ships.

Push to `main` and Vercel builds and promotes to production within a minute or two.
Any other branch gets its own preview URL.

The domain records live at the registrar and already point at Vercel:

```
criterionpartners.net       A      216.198.79.1
www.criterionpartners.net   CNAME  <project>.vercel-dns-017.com
```

The apex redirects to `www`, which is configured in the Vercel project's Domains tab.

Note that `assets/site.css` and `assets/site.js` are served with `must-revalidate`
because their filenames are not content-hashed. The images and the video are served
`immutable` for a year, so if you replace one, give it a new filename.
