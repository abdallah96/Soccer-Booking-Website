# Rating System Documentation

## How Ratings Are Calculated

The rating system uses a **simple average** calculation:

### Formula
```
Average Rating = Sum of all ratings / Total number of reviews
```

**Example:**
- Review 1: 5 stars
- Review 2: 4 stars  
- Review 3: 5 stars
- **Average = (5 + 4 + 5) / 3 = 4.67** (rounded to 1 decimal: **4.7**)

### Rounding
Ratings are rounded to **1 decimal place** using:
```javascript
Math.round(averageRating * 10) / 10
```

## How It Was Built

### Architecture Flow

1. **User Submits Review** → Frontend (`ReviewModal.tsx`)
2. **API Processes** → Backend (`/api/reviews/route.ts`)
3. **Database Stores** → Supabase (`reviews` table)
4. **Average Calculated** → Backend recalculates from all reviews
5. **Field Updated** → `fields.rating` column updated
6. **Frontend Displays** → Field detail page shows average

## Files Used

### 1. Database Schema
**File:** `src/lib/db/blocked_slots_reviews.sql`
- Creates `reviews` table with `rating` column (1-5 integer)
- Creates `fields` table with `rating` column (decimal for average)
- Sets up RLS policies

### 2. API Routes

#### **GET Reviews** - Fetch and Calculate
**File:** `src/app/api/reviews/route.ts` (lines 16-78)
- Fetches all reviews for a field
- Calculates average: `reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length`
- Returns: `{ reviews: [...], averageRating: 4.7 }`

#### **POST Review** - Create and Update Average
**File:** `src/app/api/reviews/route.ts` (lines 81-232)
- Validates rating (1-5)
- Inserts new review
- **Recalculates average from ALL reviews**
- Updates `fields.rating` column
- Returns analytics data

#### **PUT Review** - Edit and Recalculate
**File:** `src/app/api/reviews/[id]/route.ts`
- Updates existing review
- **Recalculates average from ALL reviews** (after edit)
- Updates `fields.rating` column

### 3. Frontend Components

#### **Review Modal** - User Input
**File:** `src/components/fields/ReviewModal.tsx`
- Star rating component (1-5 stars)
- Form for comment and rating
- Handles anonymous reviews
- Tracks analytics on submit

#### **Field Detail Page** - Display
**File:** `src/app/fields/[id]/page.tsx`
- Fetches reviews via API
- Displays average rating
- Shows individual reviews with star ratings
- Allows editing own reviews

#### **Home Page** - Reviews Section
**File:** `src/app/page.tsx`
- Fetches reviews for display
- Shows average rating on homepage

### 4. Types
**File:** `src/types/index.ts`
- `Review` interface with `rating: number`
- `Field` interface with `rating: number`

### 5. Analytics
**File:** `src/lib/utils/analytics.ts`
- `trackReview()` function
- Tracks `review_submitted`, `review_edited`, `rating_given` events

## Calculation Details

### When Average is Calculated

1. **On Review Fetch (GET)**
   ```javascript
   // Line 64-66 in /api/reviews/route.ts
   const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
   ```
   - Calculated on-the-fly when fetching reviews
   - Not stored, always fresh

2. **On Review Create (POST)**
   ```javascript
   // Line 198-210 in /api/reviews/route.ts
   const { data: allReviewsData } = await supabase
     .from('reviews')
     .select('rating')
     .eq('field_id', field_id);
   
   const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
   
   await supabase
     .from('fields')
     .update({ rating: Math.round(avgRating * 10) / 10 })
     .eq('id', field_id);
   ```
   - Fetches ALL reviews for the field
   - Calculates new average
   - **Stores in `fields.rating` column** for quick access

3. **On Review Edit (PUT)**
   ```javascript
   // Line 91-104 in /api/reviews/[id]/route.ts
   // Same process as POST - recalculates from all reviews
   ```

### Why Two Places?

- **`fields.rating`** - Cached value for quick display (updated on create/edit)
- **Calculated on GET** - Always accurate, includes latest reviews

## Rating Range

- **Minimum:** 1 star
- **Maximum:** 5 stars
- **Validation:** Enforced in API (lines 93-97)

## Anonymous Reviews

- Anonymous reviews are included in average calculation
- Same weight as authenticated reviews
- Stored with `user_id = null` and `reviewer_name`

## Example Calculation Flow

1. User submits 5-star review
2. API fetches existing reviews: [4, 5, 3]
3. New calculation: (4 + 5 + 3 + 5) / 4 = 4.25
4. Rounded: 4.3
5. `fields.rating` updated to 4.3
6. Frontend displays 4.3 stars

## Key Points

✅ **Simple average** - No weighted calculations
✅ **Real-time** - Recalculated on every create/edit
✅ **Cached** - Stored in `fields.rating` for performance
✅ **Accurate** - Always includes all reviews
✅ **Rounded** - 1 decimal place for display

