# Andrey Toriyanik — Portfolio

Single-page portfolio site (`index.html`) with a PHP contact-form handler (`save.php`).  
Dark theme, self-contained HTML (CSS, JS, and profile photo embedded as base64).

## Project structure

```
Portolio/
├── index.html          # Main site (nav, hero, services, about, skills, projects, contact)
├── save.php            # Contact form handler — saves CSV + optional email
├── contact-data/       # Form submissions (local dev & fallback on restricted hosts)
│   ├── .gitkeep
│   ├── .htaccess       # Deny from all — blocks browser access to submissions
│   └── messages.csv    # Created on first submission (gitignored)
├── demos/
│   ├── booking-planner/  # Rebranded landing-page demo (fictional “Torio” brand)
│   ├── ecru-store/       # ÉCRU storefront source (deployed to ecommerce repo)
│   └── avela-clinic/     # AVELA clinic source (deployed to clinicdemo repo)
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

Requires **PHP 7.4+** (built-in web server).

From the project folder:

```bash
php -S localhost:8000
```

Open [http://localhost:8000](http://localhost:8000).

### Contact form

The form POSTs to `save.php`, which:

1. Validates input (including a honeypot field for bots)
2. Appends each submission to `contact-data/messages.csv`
3. Sends an email notification via PHP `mail()` (if enabled in `save.php`)

**Local note:** `mail()` often does not work on a local machine — that is expected. Submissions are still saved to the CSV. Check `contact-data/messages.csv` after sending a test message.

### Storage path

- **cPanel (recommended):** `save.php` writes to `../contact-data/` — a folder **above** `public_html`, outside the web root.
- **Local dev / restricted hosts:** if the parent folder is not available, `save.php` falls back to `./contact-data/` inside the project (protected by `.htaccess` when served via Apache).

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
| **Contact + footer** | 309–345 | `#contact` | Form, email fallback, copyright |
| **Scripts** | 347–399 | — | Year, scroll reveal, stat count-up, form AJAX |

HTML comments in `index.html` mark each section (`<!-- SECTION: … -->`) for quick navigation.

## cPanel deployment

1. Confirm the host runs **PHP 7.4 or newer** (cPanel → **Select PHP Version** or **MultiPHP Manager**).
2. Upload `index.html` and `save.php` to `public_html` (or your domain’s document root).
3. **Contact data folder (preferred):**
   - Create `contact-data` in your home directory **above** `public_html` (e.g. `/home/USERNAME/contact-data`).
   - Set permissions to `700` or `750` so only PHP can write.
   - `save.php` already points to `../contact-data/messages.csv`.
4. **If the host blocks writing outside `public_html`:**
   - Upload the `contact-data/` folder **inside** `public_html` next to `save.php`.
   - The included `.htaccess` (`Deny from all`) blocks direct browser access.
   - Change `$storeDir` in `save.php` to `__DIR__ . '/contact-data'`.
5. Set `$notifyTo` in `save.php` to your email address.
6. Test the contact form on the live site; verify a row appears in `messages.csv`.

## See also

Open [TODO.md](TODO.md) for remaining placeholders: stats, project cards, social links, and CV download.
