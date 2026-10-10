# Expo Pilot

**Expo Pilot** is a browser-based operations app for **exhibition stall fabricators**. It helps you move from messy client messages to structured briefs, internal costing, client-safe quotations, and on-site execution tracking—without mixing up what the client should see versus what stays in your workshop.

Built for the **Hacker House Goa Wispr Flow challenge**. This repository was developed through **voice-driven iteration** using **[Wispr Flow](https://wisprflow.ai/)** (speak requirements, refine in code)—a practical way to build fast when you are on the move at a hackathon or on a noisy shop floor.

---

## The problem fabricators face

Exhibition jobs rarely arrive as a single clean document. They land as **WhatsApp forwards**, email threads, and call notes: booth numbers half-confirmed, sizes argued in feet and metres, artwork “coming tomorrow,” and power loads nobody has verified yet.

At the same time, the business runs on two different numbers:

- **Internal cost** (material, print, labour, transport) and **margin**—for your eyes only.
- **Client selling price**—what goes on the quotation and must never leak workshop economics.

Without a simple system, teams re-type data into spreadsheets, miss checklist items, quote before the brief is complete, and lose track of fabrication stages when three shows overlap. **Expo Pilot** keeps one project’s brief, costing, quote, and execution in one place, stored locally in the browser without requiring a backend or cloud database in this version.

---

## What Expo Pilot does

Expo Pilot is a **browser-based workflow** (Next.js app) with six main areas:

| Area | Purpose |
|------|---------|
| **Dashboard** | Active project snapshot, workflow progress, suggested next step, rule-based **Project Assistant** |
| **Client brief** | Paste requirements, enter stall and event details, auto-calculate areas, **Analyze brief** for gaps and client follow-up questions |
| **Costing** | Line-item measurements and rates (fabricator-only internal + selling prices) |
| **Quotation** | Client-safe selling prices, GST, print / Save as PDF via the browser |
| **Execution** | Eleven production and site stages with overall progress |
| **Projects** | Create, save, open, duplicate, and delete projects; includes a **demo project** for quick walkthroughs |

There is **no backend server** and **no user login** in this version: all project data lives in **localStorage** on the device you use.

---

## Main features (implemented)

### Client brief

- Paste text from WhatsApp, email, or call notes.
- Structured fields: client, exhibition, venue, booth, stall dimensions, open sides, budget, setup and dismantling dates.
- **Floor area** (length × width) and **wall-related areas** (e.g. length × height for flex) update as you type.
- **Analyze brief**: rule-based checklist (booth number, dimensions, power, LED, flex/artwork status, furniture, setup timing, etc.) with “why it matters” and **copy-ready questions** for the client.
- Brief auto-saves to the active project (debounced).

### Costing (fabricator-only)

- Calculation types: **area (m²)**, **running metre**, **quantity**, **fixed price**.
- Quick-add **common exhibition services** (flex print, vinyl, wooden wall, carpet, flooring, lights, chairs, tables, socket, transport, installation, dismantling).
- Each line: **internal cost rate** and **client selling rate**; line and grand totals for internal cost, selling value, profit, and margin.
- Example: a **12 m × 3 m** flex wall → **36 m²**; at **₹70/m²** internal and **₹100/m²** selling → **₹2,520** internal, **₹3,600** selling, **₹1,080** profit on that line.
- Input sanitization to block invalid characters; negative values are not accepted in calculations.

### Client quotation (client-safe)

- Pulls **selling prices only** from costing—no internal rates, totals, profit, or margin.
- **Subtotal**, optional **discount**, **amount before GST**, **18% GST (extra)**, and **grand total**.
- Payment terms: **75% advance**, **25% balance on site** before handover.
- Optional client notes; **Print / Save as PDF** uses the browser print dialog (choose “Save as PDF” where supported).
- Print styles hide app navigation and fabricator-only UI.

### Execution planner

Track eleven stages (design approval through dismantling), each **Pending**, **In progress**, or **Completed**. Overall **project progress %** updates from stage status.

### Projects and demo data

- Multiple projects in the browser; **create** empty projects or **open demo** sample (TechVision pavilion).
- **Save**, **reopen**, **duplicate**, **delete** (with confirmation).
- Switching projects reloads that project’s brief, costing, quotation meta, and execution.

### UX

- **Light mode** by default; **dark mode** toggle with preference stored locally.
- Workflow strip and **suggested next step** on key pages.
- **Project Assistant** on the dashboard: summaries from your saved data—explicitly **rule-based**, not a generative AI chatbot.

---

## Tech stack

- **[Next.js 16](https://nextjs.org/)** (App Router)
- **[React 19](https://react.dev/)**
- **[TypeScript](https://www.typescriptlang.org/)**
- **[Tailwind CSS v4](https://tailwindcss.com/)**
- **[Lucide React](https://lucide.dev/)** icons
- Data: **browser localStorage** (`expo-pilot-projects-v1`, active project id)

---

## Run locally

**Requirements:** Node.js 20+ and npm.

```bash
git clone https://github.com/ashutoshdas22/Expopilot.git
cd Expopilot

npm install
npm run dev
```

**Production build:**

npm run build
npm start

**Quick demo path:** **Projects** → **Open demo project** → follow Dashboard → Client brief → Costing → Quotation → Execution.

---

## How costing and client-safe quotation work

```text
┌─────────────────┐     selling lines only      ┌──────────────────┐
│  Costing page   │ ──────────────────────────► │ Client quotation │
│  internal +     │                             │ (print / PDF)    │
│  selling rates  │                             │ no internal data │
└─────────────────┘                             └──────────────────┘
        │
        │  full lines (internal + selling)
        ▼
   Active project in localStorage
```

1. On **Costing**, you define services with measurements and two rate columns. Amounts are **measure × rate** (or lump sum for fixed items). Internal totals and margin stay on this page only.
2. On **Quotation**, the app builds lines from the same project using **selling rate and selling amount only**, then applies discount and **18% GST on the taxable amount** after discount.
3. Changing costing and refreshing or revisiting the quotation updates client-facing line items automatically from stored project data.

---

## Voice-driven development (Wispr Flow)

This project was built iteratively for the **Hacker House Goa Wispr Flow challenge** by describing features aloud and implementing them in the codebase—requirements for brief analysis, costing rules, quotation privacy, execution stages, and project storage came through **voice-driven development with Wispr Flow**, then were validated with local builds and manual workflow testing.

For this challenge, the Wispr Flow account was created using the official [**Hacker House Goa referral link**](https://ref.wisprflow.ai/hhg).
---

## Current limitations

- **No cloud sync**—data is per browser; clearing site data or switching devices does not carry projects over.
- **No authentication or multi-user permissions**—anyone with access to the browser profile can see all stored projects on that device.
- **Brief analysis and Project Assistant are heuristic**—keyword and checklist logic, not an LLM; they can miss context or mis-detect informal wording.
- **INR-focused** formatting and copy; no multi-currency engine.
- **Quotation PDF** is via the browser print pipeline, not a server-generated PDF template.
- **No integrated email, WhatsApp, or accounting exports**—copy/paste from the UI.
- **Execution tracking** is status-only; no Gantt, assignments, or file attachments.
- **No automated tests** in the repository yet; correctness relies on manual checks and production `npm run build`.

---

## Possible future improvements

- Backend with auth and encrypted project storage
- Team roles (sales vs workshop vs accounts)
- WhatsApp / email share links for client quotations only
- Deeper costing templates per venue or organizer
- Optional LLM-assisted brief parsing with human review
- Server-side PDF branding and quotation numbering
- Mobile-first install (PWA) for site supervisors
- Audit log of quote versions and approval

---

## License

No open-source license has been added yet. The "private": true field in package.json only prevents accidental publishing to npm and does not affect the public visibility of this GitHub repository.

---

## Project structure (high level)

```text
src/
  app/              # Routes: dashboard, client-brief, costing, quotation, execution, projects
  components/       # UI by feature (layout, costing, quotation, workflow, assistant, …)
  lib/              # Costing math, quotation totals, project store, brief analysis, execution
```

For questions or demos, start on the **Dashboard** with the **demo project**, then follow the **Suggested next step** actions.
