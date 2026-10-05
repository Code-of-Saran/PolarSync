# PolarSync — SIH 2026 (SIH26063)

**Integrated Polar Science Outreach, Knowledge Repository and Media Dissemination Portal.**
One gateway for India's polar research, media and outreach, with AI-assisted discovery and human-reviewed publishing.

> Prototype. All scientific records, people and metrics are representative sample data. Station names, coordinates and dates are public facts. Photographs are illustrative (Unsplash).

## Quick start

Requirements: Node 20+, Python 3.10+.

```bash
npm install
npm run setup:backend          # creates backend/.venv and installs FastAPI + numpy
npm run dev:all                # API on :8000 and web app on :3000
```

Open http://localhost:3000. The first backend start creates `backend/data/polarsync.db` and seeds it (about 10 s).

Optional neural embeddings (better semantic search, about 1 GB download):

```bash
npm run setup:backend -- --ml  # CPU torch + sentence-transformers (all-MiniLM-L6-v2)
```

If these packages are missing, the API automatically falls back to a local LSA embedding model, so search still works offline.

Other commands:

| Command | Purpose |
|---|---|
| `npm run backend` | API only (`http://localhost:8000/docs` has the OpenAPI UI) |
| `npm run dev` | Web app only (expects the API on :8000) |
| `npm run check:routes` | Smoke test: every page and key API returns 200 |
| `POLARSYNC_RESET=1 npm run backend` | Start from a fresh database |
| `POLARSYNC_EMBEDDER=lsa` | Force the LSA embedder |

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Contributor | `alex@polarsync.in` | `polar123` |
| Admin / curator | `admin@polarsync.in` | `admin123` |

The sign-in page also has one-click buttons for both. To restore the seed data between demo runs, use Command Center → **Reset demo data**.

## Demo flow

1. **Landing**: search "Antarctic ice changes", or press **Ctrl K** anywhere.
2. **AI search**: shows the pipeline steps, the AI Insight with quoted evidence, results grouped by type with relevance scores, and "Why this result?" score breakdowns. Toggle *Keyword only* to compare.
3. Open **Antarctic Sea Ice Extent Dataset** to see metadata, provenance, linked locations and related records.
4. **Polar Map**: click Maitri, then **Explore station** to see the papers, datasets, media and stories linked to it.
5. **Media**: lightbox, then **Indian Antarctic Expedition 2026** for the timeline story.
6. **Education**: the scroll story, the Maitri virtual tour (hotspots), and the quiz (score and explorer level).
7. **Contributor** (Alex): Upload, choose *Sample paper*, attach a file, **Run AI analysis**, accept or edit tags, then **Submit**.
8. **Admin** (Kavya): Review Queue, edit or approve the record (**Approve & Publish**), then **Find in search**. The new record is indexed immediately.
9. Switch the language to **தமிழ்**, and toggle **Low bandwidth mode** (Wi-Fi icon).

## Architecture

```
Next.js 16 (App Router, React 19, Tailwind 4, Framer Motion, Leaflet)
   │  /api/* and /files/* proxied via next.config rewrites
FastAPI (backend/app)
   ├── api/        auth · content · repository · media · expeditions · locations
   │               search · ai · uploads · submissions · reviews · dashboard · analytics
   ├── services/   embeddings (MiniLM | LSA) · search_service (hybrid index) · ai_service · text (vocabulary)
   ├── database/   SQLite repository layer (db.py) · seed data
   ├── models/     domain models · schemas/ request models
   └── data/       polarsync.db · uploads/   (git-ignored)
```

**Hybrid search.** Score = 0.4 × semantic (cosine over embeddings) + 0.4 × BM25 keyword + 0.2 × metadata intent (region / type / research area, plus recency and popularity). Queries are expanded with a 40-concept polar-science vocabulary.

**AI service.** All outputs are computed from the submitted text; no generative LLM is used.
- `summarize()`: extractive, using embedding centrality.
- `generate_tags()`: controlled vocabulary plus TF-IDF keyphrases.
- `classify_content()`: type, region and research area with confidence scores.
- `create_embedding()`.
- Duplicate detection and quality checks.

Every output is a suggestion that a curator must approve.

## Known limitations

- Authentication is a prototype token session (no SSO, password reset or rate limiting).
- Sample videos have no media files: the player shows a labelled cinematic preview. Uploaded MP4/WebM files do play.
- Uploaded files are served from `/files` without per-record access control.
- Text extraction covers PDF, TXT, CSV and JSON. Images and videos are analysed from their metadata only.
- Engagement analytics include a simulated 60-day baseline, flagged in the UI. Content counts are live.
- Hindi translation is partial (navigation and landing). Tamil covers the UI, the main story and the polar quiz. Records stay in English.
- SQLite with in-memory exact vector search is sized for the prototype. The repository layer and index class are the swap points for PostgreSQL / pgvector or FAISS.
"# PolarSync" 
