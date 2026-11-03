# KnowledgeLog 🌐

### **The Frontier of Human Knowledge**

> _"Daily deep dives into Artificial Intelligence, Quantum Mechanics, and Astrophysics. Curated for the curious mind."_

---

### 🚀 **About**

**KnowledgeLog** is a next-generation digital publication designed for engineers, scientists, and futurists. We bridge the gap between complex technical breakthroughs and readable, engaging insights.

Forget the noise. We focus on the **signal**—the technologies and discoveries that are actually shaping the future of our civilization.

---

### ⚡ **Topics We Cover**

- 🧠 **Artificial Intelligence**: From LLMs to AGI, and the ethics of sentient code.
- ⚛️ **Quantum Computing**: Unlocking the processing power of the universe.
- 🚀 **Space Technology**: The race to Mars, fusion propulsion, and orbital infrastructure.
- 🧬 **Biotechnology**: CRISPR, longevity, and the digital-biological interface.
- 🔬 **Hard Science**: Physics, Mathematics, and Chemistry explained.

---

### ✨ **Platform Experience**

KnowledgeLog isn't just a blog; it's a premium reading experience built with modern web capability.

- **Immersive Design**: A "Dark Mode" first aesthetic inspired by the depth of space.
- **Rich Content**: Deep-form articles with syntax highlighting, interactive blocks, and media.
- **Curated Newsletter**: A weekly briefing joined by thousands of engineers.
- **Community**: A space for thoughtful discussion and debate on the bleeding edge of tech.

---

### 🛠️ **Built With**

This platform is engineered using the latest web standards:

- **Next.js 16** (App Router)
- **TypeScript** for type-safe reliability
- **Tailwind CSS** for rapid, modern styling
- **MongoDB** for scalable content management
- **NextAuth** for secure user authentication

Use Node.js 22.12 or newer for local development and deployment.
AI Studio's quality checks are heuristic; editors must verify source claims before publishing.

### Scheduled publishing and automation

Scheduled post publishing and automated AI research synchronization are disabled. The GitHub Actions workflow files are retained as `.yml.disabled` commented references, outside GitHub Actions' active workflow file extensions. The corresponding cron endpoints return HTTP 410 after Bearer-token authentication and do not perform scheduled work. New posts cannot be assigned the `scheduled` status. Existing scheduled posts remain stored for compatibility but are private; review them in Admin and manually move each to draft, published, or archived.

AI research source synchronization remains available as a manual AI Studio action. No new `CRON_SECRET` needs to be provisioned to disable automation: without a valid configured secret, the cron routes fail closed with HTTP 401; with a valid Bearer token, they return HTTP 410. If a Vercel Cron Job or another external scheduler was configured in a provider dashboard, disable or delete it there as well; this repository cannot verify or change provider-dashboard settings.

### Tests

Run `npm test` with a local MongoDB test database available. The integration suites use uniquely named databases containing `test` and drop only those databases after execution. Like-route integration checks require MongoDB transactions, so use a local replica set to run them; they are explicitly reported as skipped when MongoDB is a standalone server.

Before deploying the AI Studio changes to an existing MongoDB database, point `MONGODB_URI` at the intended production database and inspect it in dry-run mode:

```powershell
$env:MONGODB_URI = "<URI for the intended database>"
npm run db:verify-ai-opportunity-index
```

Resolve any reported duplicate `aiOpportunityId` values manually, then explicitly create and verify the unique partial index:

```powershell
npm run db:verify-ai-opportunity-index -- --apply
```

The script checks the exact index definition and never drops or replaces an existing index. A successful local test run or dry run does not prove that the production database has the index; only running the command against the intended database verifies it.

### User email normalization migration

New user records normalize email addresses to lowercase. Before applying the case-insensitive unique index to an existing database, back up the database and run the migration in dry-run mode:

```powershell
$env:MONGODB_URI = "<URI for the intended database>"
npm run db:migrate-user-email-index
```

If duplicate case-insensitive groups are reported, resolve the accounts manually first; the script never merges or deletes users and makes no changes in dry-run mode. Once the dry run is clean, run `--apply` during a controlled maintenance window. It creates the case-insensitive unique index before normalizing existing addresses, so new writes cannot introduce a duplicate between the preflight and normalization:

```powershell
npm run db:migrate-user-email-index -- --apply
```

The migration refuses to proceed when duplicate or empty email records remain and never drops/replaces existing indexes. Do not run `--apply` until the intended database has been backed up and the duplicate report reviewed.

---

<p align="center">
  Built with ❤️ by BlackCoder
</p>
