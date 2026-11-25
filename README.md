# ORYQEN STUDIOS — website

Dark, cinematic, animated rebuild of oryqenstudio.com. Plain HTML, CSS and JavaScript — no framework.

## Deploy

Upload the contents of the `site/` folder to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages with a custom domain, cPanel). It must be served from the domain root, because pages link to `/assets/...`.

`site/404.html` is the not-found page; most hosts pick it up automatically.

## Preview locally

```bash
node serve.js
```

Then open http://localhost:4173

## Edit content

All text (services, projects, FAQs, pricing, articles, legal) lives in `src/content.js`. After editing, regenerate the pages:

```bash
node build.js
```

No packages to install; Node 18+ is enough. In titles, `*asterisks*` mark the words shown in the italic accent.

To add a project: add an entry to `projects` in `src/content.js`, drop its cover image in `site/assets/img/`, and rebuild. It appears on the home gallery, the portfolio grid and gets its own case-study page.

## Contact form

The form needs somewhere to send enquiries. Open `site/assets/js/main.js` and set `FORM_ENDPOINT` at the top to a form service URL (Formspree, Web3Forms, Basin, or your own API). Until that is set, submitting opens the visitor's email app with the enquiry pre-filled, and the "Send via WhatsApp" button does the same through WhatsApp.

## Where things are

| Path | What |
| --- | --- |
| `src/content.js` | All copy and project data |
| `build.js` | Page templates and generator |
| `site/assets/css/main.css` | Design tokens (colours, fonts) at the top, then components |
| `site/assets/js/gl.js` | WebGL particle hero |
| `site/assets/js/main.js` | Page transitions, scroll animations, filters, form |
| `site/assets/vendor/` | GSAP, ScrollTrigger, Lenis (self-hosted) |

Animations switch off automatically for visitors who have "reduce motion" enabled, and the site stays fully readable without JavaScript.
