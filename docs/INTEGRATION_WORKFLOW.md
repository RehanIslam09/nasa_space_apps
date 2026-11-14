# Integration Workflow & Synchronization Runbook

Integration is an explicit, scheduled development phase where independent frontend and backend feature work is merged, connected, and verified.

---

## 1. When Does Integration Occur?

Integration happens only after both developers have completed their planned features for a cycle on their respective feature branches (`frontend/<name>` and `backend/<name>`) and all independent quality gates have passed.

---

## 2. Integration Step-by-Step Procedure

```mermaid
flowchart TD
    Step1["1. Create Integration Branch<br/>(integration/cycle-N from main)"]
    Step2["2. Merge Frontend Feature PR<br/>(frontend/feature-x)"]
    Step3["3. Merge Backend Feature PR<br/>(backend/feature-x)"]
    Step4["4. Flip Client to Real Mode<br/>(NEXT_PUBLIC_API_MOCK=false)"]
    Step5["5. Execute Full Monorepo Verification<br/>(Contract, Backend, Frontend, Build & DB tests)"]
    Step6["6. Open Integration PR to main"]
    Step7["7. Merge to main & Tag Release"]

    Step1 --> Step2 --> Step3 --> Step4 --> Step5 --> Step6 --> Step7
```

### Integration Commands

```bash
# 1. Run all tests across workspace
pnpm test:all

# 2. Verify architectural boundaries
pnpm boundary:check

# 3. Verify strict TypeScript type checking across all workspaces
pnpm type-check

# 4. Verify Next.js production build
pnpm build

# 5. Verify live PostgreSQL connectivity
pnpm db:verify
```
