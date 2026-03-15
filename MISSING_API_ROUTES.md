# API Routes — Restored (was: Missing, caused 404 on production)

**Update:** These routes were restored from commit `917272f` (feedback implementation). The following were re-added so production no longer returns 404 for these endpoints.

## Critical (core user flows)

| Endpoint | Used by | Purpose |
|----------|---------|---------|
| `POST /api/auth/login` | Login page | User login |
| `GET /api/bookings` | My bookings, profile | List user's bookings |
| `POST /api/bookings` | Field booking page | Create booking |
| `GET /api/bookings/[id]` | Booking confirmation page | Load booking details |
| `POST /api/bookings/[id]/cancel` | My bookings | User cancel |
| `GET /api/bookings/availability` | Field page calendar | Slot availability + monthly overview |
| `GET /api/fields` | Fields page (redirect) | List fields |
| `GET /api/fields/[id]` | Field detail page | Single field (useField hook) |

## Reviews

| Endpoint | Used by |
|----------|---------|
| `GET /api/reviews?field_id=...` | Field page reviews |
| `POST /api/reviews` | Submit review |
| `PUT /api/reviews/[id]` | Edit review |
| `DELETE /api/reviews/[id]` | Delete review |
| `GET /api/admin/reviews` | Admin reviews list |
| `POST/PUT/DELETE /api/admin/reviews/[id]/reply` | Admin reply to review |

## Admin

| Endpoint | Used by |
|----------|---------|
| `GET /api/admin/bookings` | Admin bookings list + filters |
| `PUT /api/admin/bookings/[id]` | Confirm / cancel booking |
| `GET /api/admin/stats` | Dashboard (revenue, occupation, etc.) |
| `GET /api/admin/fields` | Admin fields list |
| `GET/PUT /api/admin/fields/[id]` | Admin edit field |
| `GET/POST/DELETE /api/admin/users` | Admin users + create/delete admin |
| `GET/POST/DELETE /api/admin/blocked-slots` (+ `[id]`) | Block dates/slots |
| `GET /api/admin/week-availability` | Week availability config |
| `POST /api/admin/upload` | Image upload |
| `POST /api/admin/password` | Change password |

## Other

| Endpoint | Used by |
|----------|---------|
| `GET /api/week-availability?field_id=...` | Field page (open weeks) |
| `GET /api/users?phone=...` | Admin manual booking (find user) |
| `GET/PUT /api/users/[id]` | Profile update |

---

**Next step:** Restore these routes from your full codebase (e.g. another branch or backup), or re-implement them. The UI is built to call these URLs; without the routes, you get 404 on production.
