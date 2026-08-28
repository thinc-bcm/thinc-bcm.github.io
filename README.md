# THINC Computational Biology — website

Static site for the computational biology group at the Therapeutic Innovation Center (THINC),
Baylor College of Medicine.

No build step, no dependencies, no framework. Four files and a folder of Markdown.

```
index.html          markup
assets/styles.css   light + dark theme, one accent colour
assets/main.js      hero embedding, research areas, papers + team loaders
papers.json         curated list of recent papers
team/               one Markdown file per person  → see team/README.md
.nojekyll           stops GitHub Pages rewriting the .md bios
```

## Run it locally

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>. Opening `index.html` straight off disk will show everything
except the team bios — the browser blocks `fetch()` on `file://` URLs.

## Editing content

| what | where |
|------|-------|
| Your own bio | `team/<you>.md` — see [team/README.md](team/README.md) |
| Who is listed, and in what order | `team/index.json` |
| Featured papers | `papers.json` — see below |
| Research areas & cluster colours | `AREAS` at the top of `assets/main.js` |
| Software cards | the `#software` section of `index.html` |
| Headline, blurb, footer links | `index.html` |

Research area keys in `AREAS` are the same keys people use in the `topics:` line of their bio, which
is what links a person to a cluster in the hero animation. Rename a key in one place and you must
rename it in the other.

## Papers

`papers.json` is a hand-picked list of foundational papers, rendered in the order written — not
sorted, not a feed. Add an entry:

```json
{
  "title": "Paper title in sentence case",
  "authors": ["First A", "Second B", "Simon LM", "Senior Z"],
  "venue": "Journal Name",
  "year": 2025,
  "doi": "10.1038/s41467-025-59641-1",
  "mark": "*"
}
```

`mark` is optional. It puts a superscript symbol on your name in the author list, the way the paper
itself would, and adds the matching line to the legend under the section:

| symbol | means |
|--------|-------|
| `*`    | co-first author |
| `+`    | corresponding author |
| `†`    | co-corresponding author |

Combine them — `"mark": "*†"` for co-first and co-corresponding. Omit the field when there is
nothing to flag; sole first authorship needs no symbol, since the position in the list already
shows it. The legend only lists symbols actually used, so it stays in step on its own. To add
another symbol, extend `MARKS` in `assets/main.js`.

Give the **full** author list. Lists longer than five names are elided on the page to the first
three plus the senior author, with `Simon LM` always kept visible — that behaviour is
`OUR_AUTHOR` / `authorParts()` in `assets/main.js`. Titles link to `https://doi.org/<doi>`.

Google Scholar has no API and its terms forbid scraping, so metadata here comes from PubMed and
Crossref. To look something up:

```bash
curl "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&term=Simon+LM%5BAuthor%5D+AND+Baylor+College+of+Medicine%5BAffiliation%5D"
```

Then `esummary.fcgi?db=pubmed&retmode=json&id=<pmid>` for the DOI, and
`https://api.crossref.org/works/<doi>` for the author list.

Caveats worth knowing, all of which have bitten this file already:

- **ORCID (`pub.orcid.org/v3.0/0000-0001-6148-8861/works`) is incomplete.** It was missing five
  2025–2026 papers, including ones in *Blood* and *Science Advances*. Do not treat it as the source
  of truth.
- **PubMed does not index everything.** *Nature Machine Intelligence* is absent, so the INSCT paper
  has to come from Crossref by DOI.
- **PubMed author matching is fuzzy.** `Simon LM[Author]` with a Baylor affiliation also returns
  2006–2007 otolaryngology papers by a different person.
- **Always resolve the DOI from the PMID.** Guessing a DOI from journal and year lands on the wrong
  article — that happened twice while building this list.

## Deploying to GitHub Pages

Repository: `thinc-bcm/thinc-bcm.github.io` publishes at `https://thinc-bcm.github.io/`.
Push the contents of this folder to the repository root on `main`, then in
**Settings → Pages** set Source to *Deploy from a branch*, branch `main`, folder `/ (root)`.

For a custom domain, add a `CNAME` file containing the hostname and point a DNS CNAME record at
`thinc-bcm.github.io`.

## Accessibility notes

- The hero animation is decorative (`aria-hidden`) and stops entirely under
  `prefers-reduced-motion: reduce`; it also pauses once scrolled out of view.
- Colours are defined once as custom properties, with a full dark-mode palette.
- Every interactive element is a real link or button with a visible focus ring.
