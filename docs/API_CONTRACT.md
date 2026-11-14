# NASA Experience — Shared API Contract Specification

This document is the authoritative specification for all communication between the Frontend application and Backend services.

All schemas defined here are implemented in code at `packages/contracts/src/` using Zod and TypeScript, published as `@nasa-experience/contracts`.

---

## 1. Response Envelope Standard

Every API response conforms to `ApiResponse<T>`:

### Success Response (`ApiSuccessResponse<T>`)

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-11-14T10:00:00.000Z"
  }
}
```

### Error Response (`ApiErrorResponse`)

```json
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

## 2. Endpoint Catalog

### System Health Diagnostics (`/api/health`)

- **HTTP Method**: `GET`
- **Route**: `frontend/src/app/api/health/route.ts`
- **Contract Schema**: `HealthResponseSchema` (`@nasa-experience/contracts`)
- **Backend Service**: `healthService` (`@nasa-experience/backend`)
- **Example Success Response**:
  ```json
  {
    "success": true,
    "data": {
      "status": "healthy",
      "phase": "02-application-shell (Backend Supabase Architecture)",
      "services": {
        "supabaseAuth": "configured",
        "database": "configured"
      }
    },
    "meta": {
      "timestamp": "2026-11-14T11:00:00.000Z"
    }
  }
  ```

---

## 3. Contract Change Request (RFC) Protocol

Neither developer may change a schema in `packages/contracts/` without an approved RFC:

1. Document the proposed schema change in an RFC below.
2. Obtain approval from both developers and Technical Lead.
3. Update `packages/contracts/src/` first and run `pnpm test:contract`.
4. Update frontend mock fixtures and backend services.
