# jackalperstein.com

Personal portfolio for Jack Alperstein — Public Health Data Scientist.

The site is a single-page, scroll-driven journey: a full-screen 3D globe
(Three.js) that flies the camera between the places that shaped Jack's career,
one chapter at a time, from North San Diego County out across four countries and
back to Los Angeles.

## Stack

- Pure HTML / CSS / vanilla JS — no build step, no framework
- [Three.js](https://threejs.org/) r128 for the WebGL globe (loaded from a CDN)
- Google Fonts: DM Sans + Inter
- Hosted on Cloudflare (static assets), configured in `wrangler.jsonc`

## Structure

```
jackalperstein.com/
├── index.html        # The page: globe canvas, name badge, jump-to nav, scrolling chapters
├── journey.css       # All styles
├── journey.js        # Globe, camera flight, scroll sync, jump-to nav, photo lightbox
├── wrangler.jsonc    # Cloudflare deploy config (worker name: jackalperstein)
├── assets/
│   ├── earth-texture.jpg
│   ├── Jack Alperstein_Resume.pdf
│   └── journey/<location>/…   # Per-chapter photos (sandiego, kenya, berkeley, …)
├── archive/          # Previous multi-page version of the site, kept for reference
└── README.md
```

## The journey (chapters)

Scrolling advances through these stops; the globe flies to each and the
jump-to nav (top-right) can skip to any of them:

1. **Explore** — intro / wide view of the globe
2. **Growing Up** — North San Diego County, California (1994–2013)
3. **A Wider World** — Nyeri, Kenya (2008)
4. **Undergraduate** — Berkeley, California (2013–2017)
5. **Peace Corps** — East Region, Cameroon (2017–2020)
6. **The Carter Center** — Moyen-Chari, Chad (2020–2022)
7. **Graduate School** — Atlanta, Georgia (2022–2024)
8. **Rimoin Lab @ UCLA** — Los Angeles, California (2024–Present)
9. **Global Fieldwork Continues** — Kinshasa, DRC (2024–Present)
10. **Let's Connect** — outro with LinkedIn, Resume, GitHub, and Email links

Chapter photos open in a click-to-enlarge lightbox with carousel navigation.

## Local development

Three.js loads from a CDN and the chapter photos are fetched over HTTP, so serve
the folder rather than opening `index.html` off the filesystem:

```bash
npx serve .
# or
python -m http.server
```

Then visit the printed `localhost` URL.

## Deployment

The site is hosted on Cloudflare and deploys automatically when changes are
pushed to `main`. Deploy config (worker name, static-asset directory) lives in
`wrangler.jsonc`; a manual deploy can be run with `npx wrangler deploy`.
