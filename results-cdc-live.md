# Live CDC test — claude-opus-4-6 driving the real GitHub API via a generated CDC

CDC compiled by cdc-make from GitHub's official 12.7MB OpenAPI spec (1,196 endpoints).
Upfront context: 909-token SKILL preamble. Model requests CDC sections on demand.

| task | trips | input tok | output tok | section tok served | wall | correct | answer |
|---|---|---|---|---|---|---|---|
| user_public_repos | 1 | 889 | 116 | 0 | 12.2s | ✔ | `12` |
| newest_org_repo | 1 | 898 | 166 | 0 | 10.3s | ✔ | `anthropics/jacobian-lens` |
| org_total_stars | 1 | 898 | 305 | 0 | 10.7s | ✔ | `580924` |
| **TOTAL** | 3 | 2,685 | 587 | 0 | 33.2s | 3/3 | |
