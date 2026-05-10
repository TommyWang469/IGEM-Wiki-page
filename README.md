# iGEM YOUR_TEAM 2025 — Wiki

The official wiki for **iGEM YOUR_TEAM 2025**, built on the [iGEM Wiki Starter Pack](https://github.com/igembitsgoa/igem-wiki-starter).

---

## Stack

| Tool | Purpose |
|---|---|
| [Pug](https://pugjs.org) | HTML templating |
| [SCSS](https://sass-lang.com) | Styling (dart-sass via Webpack) |
| [Bootstrap 4](https://getbootstrap.com/docs/4.6/) | Responsive layout |
| [Webpack 4](https://webpack.js.org) | Build system |
| [Three.js r152](https://threejs.org) | 3D homepage animation |
| [GSAP 3 + ScrollTrigger](https://greensock.com/gsap/) | Scroll & intro animations |
| [Font Awesome 5](https://fontawesome.com) | Icons |
| [WikiSync](https://github.com/igembitsgoa/igem-wikisync) | Upload to iGEM.org |

---

## Project Structure

```
src/
├── src/
│   ├── index.pug          ← Homepage (3D animated)
│   ├── nav.yml            ← Navigation structure (edit this to change the nav)
│   ├── pages/             ← One .pug file per wiki page
│   │   ├── Description.pug
│   │   ├── Design.pug
│   │   ├── Results.pug
│   │   ├── Experiments.pug
│   │   ├── Notebook.pug
│   │   ├── Engineering.pug
│   │   ├── Team.pug
│   │   ├── Attributions.pug
│   │   ├── Collaborations.pug
│   │   ├── Human_Practices.pug
│   │   ├── Safety.pug
│   │   └── Parts.pug
│   ├── templates/         ← Shared layout components
│   │   ├── contents.pug   ← Page layout with sidebar TOC
│   │   ├── nav.pug        ← Top navigation bar (auto-generated from nav.yml)
│   │   ├── footer.pug     ← Footer
│   │   └── mixins.pug     ← Reusable Pug macros
│   ├── css/
│   │   ├── _main.scss     ← Global styles + Bootstrap
│   │   ├── _nav.scss      ← Navbar styles
│   │   ├── _footer.scss   ← Footer styles
│   │   ├── home.scss      ← Homepage-only dark sci-fi styles
│   │   └── content.scss   ← Article/content page styles
│   ├── js/
│   │   ├── main.js        ← Navbar scroll, dark mode, custom cursor
│   │   ├── home3d.js      ← Three.js DNA helix scene + GSAP animations
│   │   └── content.js     ← Sidebar TOC, syntax highlighting
│   └── assets/
│       ├── img/           ← Images
│       └── fonts/         ← Web fonts
├── utils/                 ← Python build scripts (run automatically by npm start)
│   ├── preprocess.py      ← Injects urlPrefix before build
│   ├── nav.py             ← Generates nav from nav.yml
│   └── citations.py       ← Resolves DOIs → citation data
├── webpack.common.js
├── webpack.development.js
├── webpack.production.js
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js ≥ 14
- Python 3.7+, with `pip install pyyaml requests`

### Install & Run

```bash
cd src
npm install

# Start dev server (auto-opens browser at http://localhost:8081) 
cd "/Users/hongqingwang/Documents/GitHub/IGEM wiki/src"
npm start
```

### Build for Production

```bash
cd src
npm run build:all
```

Output goes to `src/dist/`.

---

## What Was Built

- **3D animated homepage** — rotating DNA double helix (Three.js r152), 1200 floating particles, 6 floating colour orbs, mouse-tracking parallax, GSAP scroll animations, custom glow cursor
- **Dark sci-fi design** — Orbitron + Rajdhani fonts, cyan/purple/teal palette on near-black background, glowing section cards
- **All 12 wiki pages** — stub pages for Description, Design, Results, Experiments, Notebook, Engineering, Team, Attributions, Collaborations, Human Practices, Safety, Parts
- **Simplified navigation** — Project dropdown, Team dropdown, Human Practices, Safety, Parts
- **3-column footer** with quick links

---

## Before You Do Anything Else

Replace all `YOUR_TEAM` placeholders with your real iGEM team name:

```bash
grep -r "YOUR_TEAM" src/ --include="*.pug" --include="*.yml" --include="*.json" -l
```

---

## Adding or Editing a Page

Edit any file in `src/src/pages/`. Pages use Markdown inside Pug:

```pug
extends ../templates/contents.pug

block headVars
    - var title = "Your Page Title"
    - var tagline = "A short description"
    - var requireMathJax = false

block article
    :markdown-it(html)

        # Your Heading

        Write your content in Markdown here.

//- DO NOT MODIFY THIS LINE AND ANYTHING BEYOND.
```

To add a new page, also add it to `src/src/nav.yml`.

---

## Deploying to iGEM.org

1. Set `IGEM_USERNAME` and `IGEM_PASSWORD` as GitHub repository secrets
2. Commit with `iGEM-deploy` in the commit message — GitHub Actions will build and upload via WikiSync automatically

---

## Known Constraints

- **Webpack 4**: Three.js must stay at `^0.152.x` — newer Three.js uses `static {}` class fields that Webpack 4 cannot parse without special Babel config
- **Sass deprecation warnings**: Bootstrap 4 uses deprecated `@import` and colour functions — these are warnings only, the CSS compiles correctly

---

## Future Improvements

- [ ] Replace all `YOUR_TEAM` placeholders with real team name
- [ ] Add team photos and populate `Team.pug`
- [ ] Write real project content for each page
- [ ] Add experiment images to `src/src/assets/img/`
- [ ] Add citations as `.yml` files in `src/src/citations/`
- [ ] Customise colour theme in `home.scss` to match team branding
- [ ] Add team logo to navbar in `nav.pug`
- [ ] Mobile polish — test navbar and cards on small screens
- [ ] Upgrade to Webpack 5 (unlocks latest Three.js)
