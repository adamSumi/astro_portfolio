# Astro Marketing Portfolio Template

An editorial, high-impact portfolio template built for marketing directors, brand strategists, and growth executives.

Designed with a warm editorial aesthetic (`#faf8f5`), museum-style mat board framing, Cormorant Garamond serif headers, and an interactive Svelte 5 gallery island with real-time filtering, video playback, and lightbox modal examinations.

---

## ✨ Features

- **Astro 5 Content Layer**: Markdown case studies backed by strict Zod schema validation.
- **Svelte 5 Interactive Island**: Real-time multi-tag filtering, keyword search, responsive 1–4 column layouts, and native `<dialog>` lightbox.
- **Multi-Media Artifact Support**:
  - Visual artwork (`image`) with high-resolution viewing.
  - Video showcases (`video`) supporting YouTube, Vimeo, or self-hosted `.mp4` files with automatic 16:9 responsive embeds.
  - Whitepapers & publications (`document`).
- **Inline Case Study Visuals & Collateral**: Supports captioned markdown images in-narrative and a dedicated supporting collateral gallery.
- **Built-in AI Agent Skills**: Includes `.agents/skills/create-artifact` and `.agents/skills/remove-artifact` for automated case study management and contiguous ordering.
- **Template Neutral**: Fully decoupled from any personal names or branding for immediate customization.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:4321](http://localhost:4321) in your browser.

### 3. Type Check & Validation
```bash
npm run check
```

### 4. Build for Production
```bash
npm run build
```
Generates a static deployment bundle in `dist/`.

---

## 📂 Managing Case Study Artifacts

Case studies are stored in `src/data/artifacts/*.md`. You can manage them manually or using the built-in CLI:

```bash
# List all artifacts with their media type and metrics
node .agents/scripts/artifact-manager.mjs list

# Consolidate ordering across all artifacts contiguously (1, 2, 3...)
node .agents/scripts/artifact-manager.mjs consolidate

# Safely remove an artifact and clean up its associated preview/inline images
node .agents/scripts/artifact-manager.mjs remove <slug>
```

For AI agents and detailed technical documentation, see [AGENTS.md](./AGENTS.md).

---

## 📄 License
MIT License. Free to use and customize for personal or commercial portfolios.
