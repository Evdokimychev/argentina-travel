# CRUD / recovery matrix — Iteration 8

| Entity | Create | Read | Edit | Disable | Archive | Delete | Restore |
|--------|:------:|:----:|:----:|:-------:|:-------:|:------:|:-------:|
| Public tour listing | blocked | outage/empty | n/a | n/a | n/a | n/a | n/a |
| KB article | n/a editorial | ✓ | n/a UI | n/a | quarantine exists | n/a | n/a |
| Blog post | n/a | ✓ | n/a | n/a | n/a | n/a | n/a |
| Account | blocked auth | blocked | blocked | blocked | blocked | blocked | blocked |
| Organizer application | blocked auth | blocked | blocked | blocked | blocked | blocked | blocked |
| Booking/lead | blocked | blocked | blocked | blocked | blocked | blocked | blocked |
| CMS document | not tested | not tested | not tested | not tested | not tested | not tested | not tested |

Blocked = UI reachable but data plane / auth prevents completion in this environment.
