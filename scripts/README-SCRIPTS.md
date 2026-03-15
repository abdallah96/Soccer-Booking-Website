# Scripts – Super Admin & Clean Data

**Security:** Real credentials (Supabase keys, admin passwords) must **only** live in `.env.local`, which is **gitignored**. Never commit real emails, passwords, or API keys. The examples below use placeholders.

---

## 1. Create Super Admin

Creates the first (or another) **Super Admin** account. Only Super Admins can create/delete admins and delete users from the admin panel.

**Usage:**

```bash
# With arguments (recommended) — use YOUR own email, name, password
npm run create-super-admin <email> <name> <password> [phone]

# Example (placeholders — replace with your values)
npm run create-super-admin your-email@example.com "Your Name" "YourSecurePassword" "+221700000000"

# Update password of existing Super Admin
npm run create-super-admin your-email@example.com "Your Name" "NewPassword" --update-password
```

**With environment variables** in `.env.local` (gitignored — safe for real values):

```env
SUPER_ADMIN_EMAIL=your-email@example.com
SUPER_ADMIN_NAME="Your Name"
SUPER_ADMIN_PASSWORD=YourSecurePassword
SUPER_ADMIN_PHONE=+221700000000
```

Then run:

```bash
npm run create-super-admin
```

**Requirements:**

- `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Database migrations applied (e.g. `super_admin` role exists in `users`)
- Password at least 6 characters

**After creation:**

- Log in at `/auth/login` with the email and password.
- In Admin → Settings you can change the password and (as Super Admin) create or delete admins and delete users.

---

## 2. Clean All Data

Removes all app data (bookings, subscriptions, reviews, blocked slots, pricing rules, week availability, and users) so you can start from a clean state. **Fields and app_settings are not deleted** so the app still works.

**Usage:**

```bash
# Keep Super Admins, delete everything else (bookings, admins, normal users, etc.)
npm run clean-all-data

# Delete ALL users including Super Admins (full reset)
npm run clean-all-data -- --all-users
```

**What is deleted (in order):**

1. Bookings  
2. Subscriptions  
3. Reviews  
4. Blocked slots  
5. Pricing rules  
6. Week availability  
7. Users (all, or all except `role = 'super_admin'` if you don’t use `--all-users`)

**What is kept:**

- Tables: `fields`, `app_settings`, `time_slots` (and schema)
- If you don’t use `--all-users`: all users with role `super_admin`

**Requirements:**

- `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

**After cleaning:**

- If you kept super_admins: log in and continue.
- If you used `--all-users`: create a new Super Admin with `npm run create-super-admin ...`.

---

## Super Admin permissions (summary)

| Action              | Super Admin |
|---------------------|------------|
| Create admin        | ✅ (Admin → Settings → Gestion des Admins) |
| Delete admin        | ✅ Same section |
| Delete (normal) user| ✅ Via API; admin UI can call `DELETE /api/admin/users?id=<user_id>` for clients if you add a “Delete user” button in the Users list |
| Access admin panel  | ✅ Same as admin |
| Pause / cancel subscriptions, confirm bookings, etc. | ✅ Same as admin |

Only a **Super Admin** can create or delete other admins and delete users (admins or regular users). Regular admins cannot create/delete admins or delete users.
