# Subscription (Abonnement) flow

## Step-by-step flow

```
1. CLIENT (or Admin on behalf of client)
    │
    ├─► Contacts you (e.g. WhatsApp) to ask for a recurring slot
    │
    ▼
2. ADMIN (or Super Admin) — in Admin panel
    │
    ├─► Goes to Admin → Abonnements
    ├─► Clicks "+ Nouvel abonnement"
    ├─► Fills: Client, Terrain, Jour, Heure, Durée, Remise %, Date début, (optionnel) Date fin, Paiement
    ├─► Clicks "Créer l'abonnement"
    │
    ▼
3. SYSTEM (on create)
    │
    ├─► Inserts row in `subscriptions` (status = active, next_booking_date = first occurrence of that weekday)
    ├─► Creates the FIRST booking for that date (discounted price, status = pending_payment)
    ├─► Advances next_booking_date by 7 days
    │
    ▼
4. CLIENT
    │
    ├─► Sees the new booking in "Mes réservations" (Réservations tab)
    ├─► Pays (Wave/OM/cash); admin confirms when payment received
    ├─► In "Mes réservations" → "Abonnements" tab: sees his subscription (day, time, discount, next slot date)
    │
    ▼
5. CRON (daily, e.g. Vercel Cron)
    │
    ├─► Calls GET/POST /api/subscriptions/process (with CRON_SECRET)
    ├─► Finds active subscriptions where next_booking_date is within the next 7 days
    ├─► For each: creates one booking (discounted), then next_booking_date += 7 days
    ├─► If next_booking_date > end_date: sets status = cancelled, next_booking_date = null
    │
    ▼
6. REPEAT
    │
    └─► Every week the cron creates the next booking; client pays and uses the slot; admin can pause or end subscription anytime.
```

## Who can do what

| Action | Who |
|--------|-----|
| Create subscription | Admin, Super Admin (in Admin → Abonnements) |
| Pause / cancel / edit subscription | Admin, Super Admin (same section) |
| See own subscriptions | Client (Mes réservations → Abonnements) |
| Auto-create weekly bookings | Cron job (calls `/api/subscriptions/process`) |

## Summary

- **Subscription** = weekly recurring slot + discount. Only admins create them.
- **First booking** is created when the subscription is created.
- **Next bookings** are created by the daily cron for dates within the next 7 days.
- Client sees subscriptions in "Mes réservations" and pays each generated booking as usual.
