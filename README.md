# Personal Portfolio

A simple, fast portfolio site built with plain HTML, CSS and JavaScript. No build step, so it works on GitHub Pages as-is.

## Files

| File | Purpose |
|------|---------|
| `index.html` | All page content: hero, about, skills, projects, experience, contact |
| `style.css` | Styling, light/dark themes, mobile layout |
| `script.js` | Theme toggle, mobile menu, scroll animations, project filter, galleries, typing effect, stat counters |
| `hero.js` | Animated project scenes behind the hero (SkySpot, PetWatch, Trosure, Headstrong) |
| `assets/` | Put your photo (`profile.jpg`) and CV (`cv.pdf`) here |

## Personalise it

Content is filled in from Liam's CV and project files. Still to do:

- Optionally add Code/Live links to project cards.

Photos live in `assets/` (`graduation.jpg`, `whale-shark.jpg`).

To change the accent colour, edit `--accent` in `style.css` (it appears in the light and dark theme blocks).

## Publish on GitHub Pages

1. Create a new public repository on GitHub named **`your-username.github.io`** (replace with your actual GitHub username).
2. Upload these files, either by dragging them into the repo on github.com, or from this folder:

   ```bash
   git init
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/your-username/your-username.github.io.git
   git push -u origin main
   ```

3. In the repo, go to **Settings → Pages**, set **Source** to *Deploy from a branch*, choose `main` and `/ (root)`, then save.
4. After a minute or two the site is live at `https://your-username.github.io`.

Every time you push a change, the site updates automatically.
