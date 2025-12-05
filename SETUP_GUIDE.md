# SportBook - Next.js Website Setup Guide

This document outlines what has been completed and what needs to be done next to fully implement the SportBook football field booking system.

## ✅ Completed

### Project Setup
- ✅ Next.js 16 project with TypeScript and Tailwind CSS
- ✅ Environment variables template (.env.local.example)
- ✅ Supabase client setup (browser and server-side)
- ✅ Project structure with app directory

### Types & Utilities
- ✅ TypeScript interfaces for all data models (User, Field, Booking, etc.)
- ✅ Zustand stores for state management (authStore, fieldStore, bookingStore)
- ✅ Validation schemas using Zod (Login, Register, Booking)
- ✅ Date helper utilities
- ✅ Constants (colors, time slots, sample fields, payment methods)
- ✅ Database schema SQL file

### UI Components
- ✅ Button component (primary, secondary, danger, outline variants)
- ✅ Input component with error handling
- ✅ LoadingSpinner component
- ✅ Header/Navigation component (responsive)
- ✅ Footer component

### Pages & Features Implemented
- ✅ Home page with hero section and features
- ✅ Auth pages: Login and Register
- ✅ Fields browsing page with grid layout
- ✅ Layout with Header and Footer

### API Routes (Mock)
- ✅ POST /api/auth/login (mock implementation)
- ✅ GET /api/fields (mock with sample data)

## 📝 What Needs to Be Done

### Phase 1: Authentication & Backend Integration

#### 1. Setup Supabase Project
- [ ] Create a Supabase account and project
- [ ] Get your Supabase URL and anon key
- [ ] Copy credentials to `.env.local`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=your_url
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
  JWT_SECRET=your_jwt_secret
  ```

#### 2. Create Database Tables
- [ ] Go to Supabase SQL Editor
- [ ] Copy the schema from `src/lib/db/schema.sql`
- [ ] Run the SQL to create all tables
- [ ] Verify tables were created successfully

#### 3. Implement Real Authentication
- [ ] Replace mock login in `/api/auth/login/route.ts`:
  - Use Supabase client to authenticate user
  - Query users table
  - Generate JWT token with jose library
  - Return user data and token
  
- [ ] Create `/api/auth/register` endpoint:
  - Create user in Supabase Auth
  - Insert user record in users table
  - Generate JWT token
  - Return user data and token

- [ ] Create `/api/auth/logout` endpoint

#### 4. Add Admin Auth
- [ ] Create `/admin/login` page for admin login
- [ ] Add admin authentication endpoint
- [ ] Implement JWT verification middleware
- [ ] Protect admin routes with middleware

### Phase 2: User Features

#### 1. Field Details Page
- [ ] Create `/fields/[id]/page.tsx`
- [ ] Show full field details with image gallery
- [ ] Display available time slots
- [ ] Show reviews and ratings

#### 2. Booking Flow
- [ ] Create `/booking/[fieldId]/page.tsx`
- [ ] Date and time slot selection
- [ ] Display price calculation
- [ ] Confirm booking details

#### 3. Payment Page
- [ ] Create `/booking/payment/[bookingId]/page.tsx`
- [ ] Payment method selection (Wave, Orange Money, Cash)
- [ ] Simulate payment processing
- [ ] Booking confirmation

#### 4. User Dashboard
- [ ] Create `/my-bookings/page.tsx` (protected)
  - List all user bookings
  - Show booking status
  - Allow cancellation
  
- [ ] Create `/profile/page.tsx` (protected)
  - Display user information
  - Edit profile
  - View booking history

### Phase 3: Admin Dashboard

#### 1. Admin Dashboard
- [ ] Create `/admin/page.tsx` (protected)
- [ ] Display statistics (total bookings, revenue, etc.)
- [ ] Show recent bookings
- [ ] Display popular fields

#### 2. Booking Management
- [ ] Create `/admin/bookings/page.tsx` (protected)
- [ ] List all bookings with filters
- [ ] Approve/reject pending bookings
- [ ] Update booking status
- [ ] View booking details

#### 3. Field Management (Optional)
- [ ] Create `/admin/fields/page.tsx` (protected)
- [ ] Add/edit/delete fields
- [ ] Upload field images
- [ ] Manage field availability

### Phase 4: API Routes Implementation

Replace all mock implementations with Supabase:

#### Authentication
- [ ] `/api/auth/register` - Create new user
- [ ] `/api/auth/login` - User authentication
- [ ] `/api/auth/logout` - Clear session
- [ ] `/api/auth/verify` - Verify JWT token

#### Bookings
- [ ] `/api/bookings` - GET (list user bookings)
- [ ] `/api/bookings` - POST (create booking)
- [ ] `/api/bookings/[id]` - GET (get booking details)
- [ ] `/api/bookings/[id]` - PUT (update booking)
- [ ] `/api/bookings/[id]/cancel` - POST (cancel booking)

#### Fields
- [ ] `/api/fields` - GET (list all fields) - Already done
- [ ] `/api/fields/[id]` - GET (field details)
- [ ] `/api/fields/[id]/availability` - GET (available time slots)
- [ ] `/api/admin/fields` - POST (create field)
- [ ] `/api/admin/fields/[id]` - PUT (update field)
- [ ] `/api/admin/fields/[id]` - DELETE (delete field)

#### Admin
- [ ] `/api/admin/bookings` - GET (all bookings with filters)
- [ ] `/api/admin/bookings/[id]` - PUT (update status)
- [ ] `/api/admin/stats` - GET (dashboard statistics)

#### Payments
- [ ] `/api/payments` - POST (process payment)
- [ ] `/api/payments/[id]` - GET (payment status)

### Phase 5: Middleware & Security

#### Middleware
- [ ] Create `src/middleware.ts` for JWT verification
- [ ] Protect `/my-bookings/*` routes
- [ ] Protect `/profile/*` routes
- [ ] Protect `/admin/*` routes (admin only)
- [ ] Redirect unauthenticated users

#### Security
- [ ] Setup Supabase RLS (Row Level Security) policies
- [ ] Users can only see their own bookings
- [ ] Admins can see all bookings
- [ ] Validate JWT tokens
- [ ] Hash passwords properly

### Phase 6: Testing & Deployment

#### Testing
- [ ] Test complete signup flow
- [ ] Test login/logout
- [ ] Test booking creation
- [ ] Test admin approval flow
- [ ] Test payment simulation
- [ ] Test responsive design on mobile

#### Deployment
- [ ] Deploy to Vercel
- [ ] Setup environment variables in Vercel
- [ ] Test production build
- [ ] Setup custom domain (optional)

## Setup Instructions for Next Steps

### 1. Run Development Server

```bash
cd /Users/amadougueye/Desktop/Abdalah\ Amadou\ Gueye/Projects/sport-website
npm run dev
```

Open http://localhost:3000

### 2. Create `.env.local` File

```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
```

### 3. Initial Testing
- [ ] Test homepage loads
- [ ] Test navigation menu
- [ ] Test fields page displays sample fields
- [ ] Test login/register pages (form validation)

### 4. Next Priority

**Recommended order:**
1. Set up Supabase and database
2. Implement real authentication with API routes
3. Create field details page
4. Implement booking flow
5. Create admin dashboard
6. Add admin booking management
7. Implement middleware and protection
8. Deploy to Vercel

## Mock Implementation Notes

**Current Mock Data:**
- Test user: `user@test.com` / `test123`
- Admin user: `admin@sport.sn` / `admin123`
- Sample fields with images loaded from Unsplash

**When implementing with Supabase:**
- Remove mock users from API routes
- Replace with actual Supabase queries
- Use Supabase Auth for authentication
- Implement JWT token generation with jose library
- Setup RLS policies for data protection

## File Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx ✅
│   │   └── register/page.tsx ✅
│   ├── admin/
│   │   ├── login/page.tsx  (TODO)
│   │   ├── page.tsx  (TODO)
│   │   └── bookings/page.tsx  (TODO)
│   ├── fields/
│   │   ├── page.tsx ✅
│   │   └── [id]/page.tsx  (TODO)
│   ├── booking/
│   │   ├── [fieldId]/page.tsx  (TODO)
│   │   ├── payment/[bookingId]/page.tsx  (TODO)
│   │   └── confirmation/page.tsx  (TODO)
│   ├── (user)/
│   │   ├── my-bookings/page.tsx  (TODO)
│   │   └── profile/page.tsx  (TODO)
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts ✅ (mock)
│   │   │   ├── register/route.ts  (TODO)
│   │   │   └── logout/route.ts  (TODO)
│   │   ├── bookings/
│   │   │   ├── route.ts  (TODO)
│   │   │   └── [id]/route.ts  (TODO)
│   │   ├── fields/
│   │   │   ├── route.ts ✅ (mock)
│   │   │   ├── [id]/route.ts  (TODO)
│   │   │   └── [id]/availability/route.ts  (TODO)
│   │   ├── payments/route.ts  (TODO)
│   │   └── admin/
│   │       ├── bookings/route.ts  (TODO)
│   │       ├── stats/route.ts  (TODO)
│   │       └── fields/route.ts  (TODO)
│   └── page.tsx ✅
├── components/
│   ├── layout/
│   │   ├── Header.tsx ✅
│   │   └── Footer.tsx ✅
│   ├── ui/
│   │   ├── Button.tsx ✅
│   │   ├── Input.tsx ✅
│   │   └── LoadingSpinner.tsx ✅
│   ├── booking/
│   │   ├── FieldCard.tsx  (TODO)
│   │   ├── BookingForm.tsx  (TODO)
│   │   ├── PaymentForm.tsx  (TODO)
│   │   └── BookingCard.tsx  (TODO)
│   └── admin/
│       ├── BookingsList.tsx  (TODO)
│       └── Statistics.tsx  (TODO)
├── lib/
│   ├── supabase/
│   │   ├── client.ts ✅
│   │   └── server.ts ✅
│   ├── stores/
│   │   ├── authStore.ts ✅
│   │   ├── fieldStore.ts ✅
│   │   └── bookingStore.ts ✅
│   ├── utils/
│   │   ├── constants.ts ✅
│   │   ├── validation.ts ✅
│   │   └── dateHelpers.ts ✅
│   └── db/
│       └── schema.sql ✅
└── types/
    └── index.ts ✅
```

## Useful Commands

```bash
# Development
npm run dev

# Build
npm run build

# Production run
npm run start

# Linting
npm run lint
```

## Support

For questions about:
- **Supabase**: https://supabase.com/docs
- **Next.js**: https://nextjs.org/docs
- **React Hook Form**: https://react-hook-form.com/
- **Zod**: https://zod.dev/
- **Zustand**: https://github.com/pmndrs/zustand
