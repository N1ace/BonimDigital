# GitHub Pages setup — N1ace

Three separate sites, three repos:

| Site | Folder on Desktop | GitHub repo | Live URL |
|------|-------------------|-------------|----------|
| **Portfolio** | `Portolio/` | `portfolio` | https://n1ace.github.io/portfolio/ |
| **Booking app demo** | `bookingapp/` | `bookingapp` | https://n1ace.github.io/bookingapp/ |
| **E-commerce demo** | `ecommerce/` | `ecommerce` | https://n1ace.github.io/ecommerce/ |

**Retail AVR** stays on the live site only: https://retailavr.co.il/ (no GitHub repo).

---

## 1. Portfolio (`Portolio` → repo `portfolio`)

```powershell
cd "C:\Users\forcr\OneDrive\Desktop\Portolio"
git init
git add .
git commit -m "Portfolio site"
git branch -M main
git remote add origin https://github.com/N1ace/portfolio.git
git push -u origin main
```

**Settings → Pages → `main` / root**

> Contact: Cal.com booking + WhatsApp + email CTAs (works on GitHub Pages).

---

## 2. Booking app (`bookingapp` → repo `bookingapp`)

```powershell
cd "C:\Users\forcr\OneDrive\Desktop\bookingapp"
git init
git add .
git commit -m "Booking app landing demo"
git branch -M main
git remote add origin https://github.com/N1ace/bookingapp.git
git push -u origin main
```

**Settings → Pages → `main` / root**

---

## 3. E-commerce (`ecommerce` → repo `ecommerce`)

```powershell
cd "C:\Users\forcr\OneDrive\Desktop\ecommerce"
git init
git add .
git commit -m "E-commerce demo placeholder"
git branch -M main
git remote add origin https://github.com/N1ace/ecommerce.git
git push -u origin main
```

**Settings → Pages → `main` / root**

Replace `index.html` when you have a real store demo to show.

---

## Create repos on GitHub first

For each project: **github.com/new** → name exactly `portfolio`, `bookingapp`, or `ecommerce` → Public → no README (you push locally).

---

## Portfolio project links (already set in `index.html`)

- Booking Planner → `https://n1ace.github.io/bookingapp/`
- E-commerce Store → `https://n1ace.github.io/ecommerce/`
- Retail AVR → `https://retailavr.co.il/`

If your portfolio repo has a **different name**, update the “back to portfolio” links in `bookingapp/index.html` and `ecommerce/index.html`.
