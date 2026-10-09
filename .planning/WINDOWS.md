---
schema_version: 1
open_count: 2
waived_count: 0
fixed_count: 0
total_count: 2
last_updated: 2026-10-08T14:15:29.631Z
---

# Broken Windows Ledger

> Cross-phase defect register. With `workflow.windows_enforce` enabled, `/gsd-ship` blocks while `open_count > 0`.
> Waive with `gsd-tools windows waive <id> "<reason>"` (reason required).
> Mark fixed with `gsd-tools windows fixed <id>`.

| id | phase | kind | file | line | description | status | reason | recorded_at | resolved_at |
|----|-------|------|------|------|-------------|--------|--------|-------------|-------------|
| 1 | 1 | unrun-verify | tests/e2e/admin-publish-tracer.spec.ts |  | User disabled browser execution; dated signed-out publication UI and Antislop browser acceptance remain manual pending. | open |  | 2026-10-08T14:15:29.311Z |  |
| 2 | 1 | unrun-verify | scripts/admin-provision.ts |  | Hidden interactive terminal password prompt manual check pending; stdin provisioning and output secrecy passed automated tests. | open |  | 2026-10-08T14:15:29.631Z |  |

````json
[
  {
    "id": 1,
    "kind": "unrun-verify",
    "phase": "1",
    "file": "tests/e2e/admin-publish-tracer.spec.ts",
    "line": null,
    "description": "User disabled browser execution; dated signed-out publication UI and Antislop browser acceptance remain manual pending.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-08T14:15:29.311Z",
    "resolved_at": null,
    "milestone": null
  },
  {
    "id": 2,
    "kind": "unrun-verify",
    "phase": "1",
    "file": "scripts/admin-provision.ts",
    "line": null,
    "description": "Hidden interactive terminal password prompt manual check pending; stdin provisioning and output secrecy passed automated tests.",
    "status": "open",
    "reason": "",
    "recorded_at": "2026-10-08T14:15:29.631Z",
    "resolved_at": null,
    "milestone": null
  }
]
````
