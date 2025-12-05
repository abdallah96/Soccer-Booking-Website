# Users and Database Seeding Summary

## 👥 User Roles & Permissions

### Regular Users
- Can browse all fields
- Can create bookings
- Can view their own bookings
- Can cancel their own bookings
- **Cannot** access admin dashboard
- **Cannot** approve/reject bookings

### Admin Users
- Can browse all fields
- Can create bookings like regular users
- **Can** access admin dashboard
- **Can** view all bookings
- **Can** approve/reject pending bookings
- **Can** view statistics and analytics

## 🔐 Default Credentials

### For Regular Users
```
Email: user@test.com
Password: test123
```

Additional test users:
```
Email: john@example.com
Email: marie@example.com
```

### For Admin
```
Email: admin@sport.sn
Password: admin123
```

## 📊 Seeding Options

### Option 1: SQL Method (Recommended ⭐)
The easiest method - just paste SQL into Supabase SQL Editor

**Files:**
- `src/lib/db/schema.sql` - Create tables
- `src/lib/db/seed.sql` - Populate data

**How to use:**
1. Go to Supabase → SQL Editor
2. Copy and run `schema.sql` first
3. Copy and run `seed.sql` second
4. Done! Your database is populated

### Option 2: TypeScript Script
For automation or CLI-based approach

**File:**
- `scripts/seed.ts`

**How to use:**
```bash
npm run seed
```

## 📋 What Gets Seeded

### Users (4 total)
- 1 Admin user (admin@sport.sn)
- 3 Regular users

### Football Fields (5 total)
- Stadium Elite (15,000 CFA/hour)
- Sunset Valley (12,000 CFA/hour)
- Riverside Sports Arena (18,000 CFA/hour)
- Petite Côte Mini (8,000 CFA/hour)
- Grand Yoff Premier (20,000 CFA/hour)

### Time Slots
- 30 days of availability
- 7 time slots per day per field
- 70% available by default

### Sample Bookings
- 4 sample bookings with different statuses (pending, confirmed, cancelled)

## 🚀 Quick Start

**Step 1: Setup Supabase**
- Create account at supabase.com
- Create a new project
- Get your URL and keys

**Step 2: Add Credentials to .env.local**
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_secret
```

**Step 3: Create Tables**
- Copy `src/lib/db/schema.sql`
- Go to Supabase SQL Editor
- Paste and execute

**Step 4: Seed Data**
- Copy `src/lib/db/seed.sql`
- Go to Supabase SQL Editor
- Paste and execute

**Step 5: Test It**
```bash
npm run dev
# Visit http://localhost:3000/fields
# Try login with user@test.com / test123
```

## 📖 Full Guides

For detailed instructions, see:
- `DATABASE_SEEDING.md` - Comprehensive seeding guide
- `SETUP_GUIDE.md` - Full implementation roadmap

## 🎯 Next Steps

After seeding:
1. ✅ Test login with the credentials above
2. ✅ Test fields browsing page
3. → Implement real authentication API routes
4. → Build field details page
5. → Create booking flow
6. → Build admin dashboard
