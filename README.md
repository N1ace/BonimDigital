# Andrey Toriyanik — Portfolio

Single-page portfolio site (`index.html`) with WhatsApp + email contact CTAs.  
Dark theme, self-contained HTML (CSS, JS, and profile photo embedded as base64).

## Project structure

```
Portolio/
├── index.html          # Main site (nav, hero, services, about, skills, projects, contact)
├── demos/
│   ├── booking-planner/  # Rebranded landing-page demo (fictional “Torio” brand)
│   ├── ecru-store/       # ÉCRU storefront source (deployed to ecommerce repo)
│   ├── avela-clinic/     # AVELA clinic source (deployed to clinicdemo repo)
│   └── barber-shop/      # Hebrew RTL barbershop demo
├── README.md
└── TODO.md             # Remaining placeholders to fill in
```

## Projects on GitHub Pages

| Project | Repo | URL |
|---------|------|-----|
| Portfolio (this site) | [N1ace/portfolio](https://github.com/N1ace/portfolio) | https://n1ace.github.io/portfolio/ |
| Booking app demo | [N1ace/bookingapp](https://github.com/N1ace/bookingapp) | https://n1ace.github.io/bookingapp/ |
| E-commerce demo | [N1ace/ecommerce](https://github.com/N1ace/ecommerce) | https://n1ace.github.io/ecommerce/ |

Retail AVR is live only at [retailavr.co.il](https://retailavr.co.il/) — not on GitHub.

Full deploy steps: [GITHUB_PAGES.md](GITHUB_PAGES.md)

## Local development

Serve the folder over HTTP (any static server):

```bash
npx serve .
```

Or open via your usual local preview. Contact is WhatsApp + mailto — no PHP required.

## Contact

The contact section links to [Cal.com](https://cal.com/andriitorianyk/30min) (30‑min call), WhatsApp, and email. There is also a floating WhatsApp button site-wide.

## `index.html` section map

| Section | Lines (approx.) | Anchor / ID | Edit for |
|---------|-----------------|-------------|----------|
| **Head + CSS** | 1–155 | — | Meta, fonts, all styles |
| **Nav** | 158–170 | — | Logo, menu links, “Let’s Talk” CTA |
| **Hero** | 172–195 | `#home` | Headline, subtext, CV button, photo (base64), status strip |
| **Services** | 197–235 | `#services` | Six service cards |
| **About** | 237–253 | `#about` | Bio, approach steps, stats (incl. XX+ placeholders) |
| **Skills** | 255–279 | `#skills` | Four skill cards with chips |
| **Projects** | 281–307 | `#projects` | Project cards (2 placeholders remain) |
| **Contact + footer** | — | `#contact` | WhatsApp + email CTAs, copyright |
| **Scripts** | — | — | Year, scroll reveal, stat count-up, tetris |

HTML comments in `index.html` mark each section (`<!-- SECTION: … -->`) for quick navigation.

## Deployment

Push to GitHub Pages (`main` / root) or upload the static files to any host. No PHP required.

## See also

Open [TODO.md](TODO.md) for remaining placeholders: stats, project cards, social links, and CV download.
