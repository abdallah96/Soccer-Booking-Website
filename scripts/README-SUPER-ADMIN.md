# Create Super Admin Script

This script creates the first Super Admin (CEO/Owner) account for Petit Camp.

## Prerequisites

1. Make sure you've run the database migration first:
   ```bash
   # Run the migration in Supabase SQL Editor:
   src/lib/db/migration_pending_payment.sql
   ```

2. Make sure your `.env.local` file has:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## Usage

### Method 1: Command Line Arguments (Recommended)

```bash
npm run create-super-admin <email> <name> <password> [phone]
```

**Example (use your own email, name, password — never commit real credentials):**
```bash
npm run create-super-admin your-email@example.com "Your Name" "YourSecurePassword" "+221700000000"
```

### Method 2: Environment Variables

Add to your `.env.local` file (this file is **gitignored** — safe for real values):
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

### Method 3: Update Existing User Password

If the Super Admin already exists, you can update their password:

```bash
npm run create-super-admin <email> <name> <password> --update-password
```

Or set in `.env.local`:
```env
UPDATE_PASSWORD=true
```

## What the Script Does

1. ✅ Checks if user already exists
2. ✅ Creates new Super Admin if doesn't exist
3. ✅ Updates existing user to Super Admin if needed
4. ✅ Hashes password securely (bcrypt)
5. ✅ Validates email and password requirements
6. ✅ Shows user details after creation

## After Running

1. **Login** at `/auth/login` with your email and password
2. **Change Password** in the Settings section of the admin panel
3. **Create Other Admins** in Settings > Gestion des Admins (only Super Admin can do this)

## Security Notes

- ⚠️ Password must be at least 6 characters
- ⚠️ The script uses service role key (bypasses RLS)
- ⚠️ Change password after first login for security
- ⚠️ Only one Super Admin can manage other admins

## Troubleshooting

**Error: "super_admin role doesn't exist"**
- Run the migration first: `src/lib/db/migration_pending_payment.sql`

**Error: "User already exists"**
- Use `--update-password` flag to update password
- Or manually update in Supabase dashboard

**Error: "Missing Supabase credentials"**
- Check your `.env.local` file has the correct keys
