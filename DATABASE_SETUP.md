# 🗄️ Database Setup Guide for Petit Camp

## Quick Start

Since you've already added your environment variables, follow these steps:

### Step 1: Run Schema Migrations

**Option A: Run SQL directly in Supabase (Recommended)**

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Run this SQL:

```sql
-- Add password_hash column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

-- Add start_time and duration to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS start_time VARCHAR(10);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS duration INTEGER;
```

**Option B: Run migration script**

```bash
npm run migrate
```

### Step 2: Seed the Database

Run the seed script to create:
- Petit Camp field
- Test users (admin and regular user)

```bash
npm run seed
```

This will create:
- **Petit Camp field** (single field for your organization)
- **Admin user**: `admin@petitcamp.sn` / `admin123`
- **Test user**: `user@test.com` / `test123`

## Environment Variables

Make sure your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=https://lfacyvxiwnvzfevlkbzb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_LOGO_URL=your_vercel_blob_logo_url
```

## What Gets Created

### 1. Petit Camp Field
- **ID**: `petit-camp-1`
- **Name**: Petit Camp
- **Location**: Dakar, Sénégal
- **Price**: 20,000 FCFA/hour (base, actual price calculated dynamically)
- **Capacity**: 22 players
- **Rating**: 4.8
- **Facilities**: Éclairage, Vestiaires, Parking, Rafraîchissements

### 2. Test Users
- **Admin**: `admin@petitcamp.sn` / `admin123`
- **User**: `user@test.com` / `test123`

Both users have hashed passwords and can be used for testing.

## Troubleshooting

### If seed script fails:

1. **Check environment variables**: Make sure `.env.local` exists and has all required variables
2. **Run migrations manually**: Use Option A above to run SQL directly
3. **Check Supabase connection**: Verify your credentials are correct

### If you get "column doesn't exist" errors:

Run the migration SQL commands manually in Supabase SQL Editor (see Step 1, Option A).

## Next Steps

After seeding:
1. ✅ Test login with `admin@petitcamp.sn` / `admin123`
2. ✅ Test registration with a new user
3. ✅ Test booking creation
4. ✅ Verify Petit Camp field appears on `/fields` page

## Notes

- The seed script uses `upsert`, so it's safe to run multiple times
- Existing users will have their passwords updated
- Petit Camp field will be created/updated if it already exists
- All passwords are hashed using bcrypt

---

**Ready to go!** 🚀

