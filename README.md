# jackalperstein.com

Personal portfolio website for Jack Alperstein — Public Health Data Scientist.

## Stack

- Pure HTML / CSS / Vanilla JS (no build step required)
- Google Fonts: Orbitron, Share Tech Mono, Inter
- Deployed via Cloudflare Pages

## Local Development

Just open `index.html` in a browser. No server required.

For live-reload dev experience:
```bash
npx serve .
```

## Deployment to Cloudflare Pages

1. Push this repo to GitHub at `github.com/jackalperstein/jackalperstein.com`
2. Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
3. Go to **Workers & Pages → Create → Pages → Connect to Git**
4. Select the `jackalperstein/jackalperstein.com` repo
5. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave blank)*
   - **Build output directory:** `/` (root)
6. Click **Save and Deploy**
7. Under **Custom Domains**, add `jackalperstein.com`

## Structure

```
jackalperstein.com/
├── index.html          # Main single-page site
├── css/
│   └── style.css       # All styles
├── js/
│   └── main.js         # Scroll + nav behavior
├── assets/
│   └── Jack_Alperstein_Resume.pdf   # Add resume PDF here
└── README.md
```

## Sections

- **Hero** — Name, terminal animation, CTA buttons
- **About** — Bio, honors, key stats
- **Projects** — Data analysis project cards
- **Experience** — Full career timeline
- **Contact** — Email, LinkedIn, location
