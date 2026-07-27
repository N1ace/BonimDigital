# ÉCRU — demo storefront

Static fashion e-commerce demo for portfolio. **GitHub Pages:** [n1ace.github.io/ecommerce](https://n1ace.github.io/ecommerce/)

## Pages
- `index.html` — homepage: hero, category index, new arrivals, editorial banners
- `shop.html` — full catalog with category filters (`shop.html?c=Dresses`)
- `product.html` — product detail, read via `?id=` (gallery, size picker, add to bag, accordions, related)
- `cart.html` — bag: quantity, remove, order summary, demo checkout

## How it works
- `assets/app.js` — the product catalog (`CATALOG`), shared header/footer, and cart logic.
- The **bag** is saved in the browser with `localStorage` (key `ecru_cart`), so it persists across pages and reloads. This needs a real web server or hosting — it will **not** persist if you open the files with `file://` or inside a preview iframe.
- All product images live in `assets/img/`.

## Edit the catalog
Open `assets/app.js` and edit the `CATALOG` array. Each product:
```js
{ id:'unique-slug', name:'Product Name', cat:'Dresses', price:145,
  imgs:['image-file-name'],           // files in assets/img/ (without .jpg)
  desc:'...', materials:'...', fit:'...' }
```
Add a photo to `assets/img/` and reference its name (no extension) in `imgs`.

## Deploy to GitHub Pages

Repo: [github.com/N1ace/ecommerce](https://github.com/N1ace/ecommerce)

```bash
git init
git add .
git commit -m "Add ÉCRU storefront demo"
git branch -M main
git remote add origin https://github.com/N1ace/ecommerce.git
git pull origin main --allow-unrelated-histories --no-edit
git push -u origin main
```

Use `N1ace@users.noreply.github.com` as git email if GitHub blocks private email (GH007).

**Settings → Pages → `main` / root** → https://n1ace.github.io/ecommerce/

## Rename the brand
The name **ÉCRU** appears in the header/footer (`assets/app.js`) and page titles. Find-and-replace `ÉCRU` to rebrand.
