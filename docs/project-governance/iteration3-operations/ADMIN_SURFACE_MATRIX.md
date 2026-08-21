# Admin surface matrix — Iteration 3

Classification is product-operational, not visual. Live persist on production is `NOT_PROVEN` while `/api/health` is 503.

| Surface | Route / module | Class | Writer | Notes |
|---|---|---|---|---|
| Dashboard | `/admin` | ACTIVE_CORE | ops summary API | Queues: moderation, organizers, leads 24h, CMS drafts, partner stale, payments |
| Operations hub | `/admin/operations` | ACTIVE_CORE | same | Partner feed health panel added |
| Users | `/admin/users` | ACTIVE_CORE | admin identity RPC | No auth-internal edits |
| Staff | `/admin/system/staff` | ACTIVE_CORE | staff atomic RPC | Invite email may be BLOCKED_EXTERNAL |
| Roles / capabilities | staff + presets | ACTIVE_CORE | DB | UI hide is not the gate |
| Organizers | `/admin/marketplace/organizers` | ACTIVE_CORE | `admin_decide_organizer_application` | Direct UPDATE revoked |
| Applications | `/api/admin/organizer-applications` | ACTIVE_CORE | RPC | Approve/reject + audit + notify |
| Tours / excursions | `/admin/marketplace/tours`, `excursions` | ACTIVE_CORE | admin tour RPC | Unpublish/archive atomic |
| Partner feeds | `/admin/system/settings` + `/api/admin/partners/operations` | ACTIVE_CORE | import jobs | Quarantine is derived, not a second CMS |
| Bookings | `/admin/operations/bookings` | ACTIVE_CORE | booking state machine | Native request CRM |
| Leads / CRM | `/admin/operations/leads` | ACTIVE_CORE | `contact_submissions` | Transitions + audit |
| Newsletter | leads page | ACTIVE_SUPPORT | newsletter API | Consent + unsubscribe remain |
| CMS documents | `/admin/content/documents` | ACTIVE_CORE | `cms_*_atomic` | Publish/unpublish revalidate |
| Knowledge | `/admin/content/knowledge` | ACTIVE_CORE | overlay + files | No mass cutover |
| Media | `/admin/media` | ACTIVE_SUPPORT | storage | Reference-safe delete still limited |
| Redirects | `/admin/system/redirects` | ACTIVE_CORE | `url_redirects` | SEO slug lifecycle |
| Integrations / settings | `/admin/system/settings` | ACTIVE_CORE | settings control plane | Secrets not raw-editable |
| Analytics | `/admin/analytics` | ACTIVE_SUPPORT | read | Launch proof is Iteration 4 |
| Privacy | `/admin/operations/privacy-requests` | ACTIVE_CORE | privacy RPCs | Live processor NOT_PROVEN |
| Audits | `/admin/system/audit` | ACTIVE_CORE | `admin_audit_log` | Append-only |
| Feature / modules | `/admin/modules`, `/admin/feature-flags` | ACTIVE_CORE | control plane | Dormant APIs stay quarantined |
| Ingestion / content-factory | `/admin/ingestion/*` | ACTIVE_SUPPORT | factory OS | Editorial overlay, not public SSOT |
| Shop / forum admin | `/admin/content/shop`, `forum` | DORMANT | quarantined public writes | Admin retained, no public leak |
| Payments / shop orders | `/admin/operations/payments` | POST_LAUNCH | gated | Own payment remains disabled |
| Apartments / mobility / experts | marketplace pages | POST_LAUNCH / DORMANT | isolated | No new product scope |
