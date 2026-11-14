---
name: research
description: Protocol for technical spikes, dependency evaluation, and API verification.
---

# Technical Research Skill Guide

## Purpose

Establishes a rigorous methodology for researching unfamiliar technologies, APIs, and documentation during hackathon spikes without compromising architectural stability.

## Research Protocol

### 1. Identify the Core Unknown

- State the exact question or architectural unknown clearly (e.g., "Does library X support React 19 server actions?").
- Document the constraints and requirements (performance target, SSR compatibility, bundle impact).

### 2. Verify Against Official Sources

- Consult primary sources:
  - Official framework documentation (Next.js docs, React docs, Supabase docs, Drizzle docs).
  - Official GitHub repositories, release notes, and migration guides.
  - Package peer dependency manifests (`npm view <package> peerDependencies`).
- Reject unverified blog posts or AI hallucinations that contradict official docs.

### 3. Build an Isolated Spike

- When testing a risky or unfamiliar integration, create a minimal scratch reproduction.
- Test under real runtime conditions:
  - Check Node.js execution.
  - Check TypeScript compiler output.
  - Check Next.js production build impact.

### 4. Synthesize & Document Findings

- Record the technical findings, trade-offs, and final recommendation.
- If an architectural choice is confirmed, log the record in `docs/DECISIONS.md`.
