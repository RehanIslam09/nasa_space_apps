# API Contract Rules & RFC Procedure

The shared contracts in `packages/contracts/` form the single source of truth for all API communication.

---

## 1. Single Source of Truth

- Resides in `packages/contracts/src/`.
- Packaged as `@nasa-experience/contracts` and consumed as a workspace dependency by both `frontend/` and `backend/`.
- Defines Zod request schemas, response schemas, and inferred TypeScript types.

---

## 2. Response Envelope Standard

Every API endpoint must conform to `ApiResponse<T>`:

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-11-14T10:00:00.000Z"
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable description",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2026-11-14T10:00:00.000Z"
  }
}
```

---

## 3. Contract Change Request (RFC) Protocol

If either developer discovers that a contract change is necessary:

1. **STOP Implementation**: Do not write code against unapproved contracts.
2. **Document the RFC**: Add a new RFC entry in `docs/API_CONTRACT.md`.
3. **Obtain Approval**: Both developers and Technical Lead must review and approve.
4. **Implement Contract First**: Commit schema changes in `packages/contracts/src/` and update `test:contract`.
5. **Parallel Update**: Frontend updates mock fixtures; Backend updates database/services.

---

## 4. Contract Verification Commands

```bash
pnpm test:contract
pnpm --filter @nasa-experience/contracts type-check
```
