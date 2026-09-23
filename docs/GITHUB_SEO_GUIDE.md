# GitHub Repository SEO & Optimization Guide for Repaper

To ensure **Repaper** ranks #1 on GitHub search and Google when anyone searches for **"paper"**, **"repaper"**, or **"note"**, several repository settings in GitHub's web interface need to be aligned with the repository's code.

Because GitHub repository metadata (About description, topics, social card) cannot be updated via Git commits alone, follow this turnkey guide to apply industry-standard repository SEO.

---

## 1. Repository "About" Section Settings

Go to your repository homepage: `https://github.com/HawkdotDev/repaper`  
Click the **⚙️ (gear icon)** at the top right of the "About" section on the right sidebar.

### A. Description (350 character limit)
Copy and paste this exact keyword-optimized text:

```text
Repaper — The ultra-fast, local-first paper-like note taking app & markdown notes workspace. Zero cloud lock-in, interactive knowledge graph, LaTeX math, and offline-first privacy. The modern open-source alternative to Notion & Obsidian for your notes.
```

### B. Website
Set the website URL:
```text
https://hawkdotdev.github.io/repaper/
```

### C. Repository Topics / Tags (Maximum 20 Topics)
GitHub allows up to 20 topics. These are heavily weighted by GitHub's internal search algorithm and Google's indexing bot. Copy and paste each of the following 20 topics:

1. `paper`
2. `repaper`
3. `note`
4. `notes`
5. `notes-app`
6. `note-taking`
7. `note-taking-app`
8. `markdown-notes`
9. `paper-notes`
10. `offline-notes`
11. `local-notes`
12. `digital-paper`
13. `pkm`
14. `knowledge-base`
15. `notion-alternative`
16. `obsidian-alternative`
17. `knowledge-graph`
18. `latex-notes`
19. `wikilinks`
20. `local-first`

### D. Include in the Home Page
Check the following:
- [x] **Releases**
- [x] **Packages** (if applicable)
- [ ] Environments (optional)

Click **Save changes**.

---

## 2. GitHub Social Preview Image (Open Graph Card)

Search engines and social platforms (Twitter, LinkedIn, Slack, Discord, Reddit) display this image whenever your GitHub repository is shared or indexed:

1. Navigate to: **Settings** > **General**
2. Scroll down to the **Social preview** section.
3. Click **Edit** > **Upload an image...**
4. Select the image from your repository:
   - Located at: `public/og-image.png` (or `resources/og-image.png`)
5. Click **Save**.

---

## 3. GitHub Search Engine Mechanics & Ranking Factors

GitHub's search ranking algorithm prioritizes repositories based on the following signals:

1. **Exact Topic Matches**: Having `paper`, `repaper`, and `note` in the repository topics provides an instant relevance boost when users filter by topic or search directly.
2. **README H1 & First 100 Words**: Search spiders index the first 100 words in the README as the primary contextual snippet. The updated README directly places "paper", "repaper", "note taking app", and "markdown notes" in this critical window.
3. **Repository Name**: `repaper` already contains both `paper` and `repaper`.
4. **Keyword Density in Descriptions**: The updated `package.json`, `index.html`, and `README.md` establish topical authority across both code and documentation.
5. **Activity & Stars**: Regular commits and stars amplify ranking in GitHub Explore and trending feeds.

---

## 4. Verification Checklist

- [ ] Repository description updated in GitHub Settings
- [ ] Website URL `https://hawkdotdev.github.io/repaper/` set in GitHub Settings
- [ ] All 20 topic tags added
- [ ] Social preview card uploaded
- [ ] Web app deployed via GitHub Pages (`npm run deploy` or GitHub Actions)
