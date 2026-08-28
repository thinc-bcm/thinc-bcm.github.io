# Writing your bio

Everyone in the group owns one file in this folder. You never need to touch anyone else's.

## Edit your own bio

1. Open your file (e.g. `team/lukas-simon.md`) on GitHub and click the pencil icon.
2. Change the header block and the text below it.
3. Commit to a new branch and open a pull request.

That's it — the site rebuilds itself from these files.

## File format

```markdown
---
name: Ada Lovelace
role: Postdoctoral Fellow
github: adalovelace
topics: rna-processing, drug-discovery
---

Your first paragraph. Two or three sentences in your own voice — what you work on,
and why that problem rather than a neighbouring one.

An optional second paragraph. **Bold**, *italic*, `code` and
[links](https://example.com) all work.
```

### Header fields

| field    | required | notes |
|----------|----------|-------|
| `name`   | yes      | Displayed as written. |
| `role`   | yes      | E.g. Group Leader, Postdoctoral Fellow, Graduate Student, Research Assistant. |
| `github` | no       | Handle only, no `@` and no URL. Omit the line if you'd rather not link one. |
| `topics` | no       | Comma-separated keys from the list below. They become the tags on your card, and hovering your card lights up your cluster in the animation at the top of the page. |

### Valid `topics` keys

`rna-processing` · `drug-discovery` · `translational`

These are defined in `assets/main.js` — if the group's research areas change, they change there first.

## Joining or leaving

- **New person:** copy an existing file to `team/firstname-lastname.md`, fill it in, and add the
  filename to `team/index.json`. The order in that file is the order on the page.
- **Leaving:** remove the filename from `team/index.json`. Keep or delete the `.md` as you prefer.
