export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin' | 'super_admin';
  created_at: string;
}

export interface Field {
  id: string;
  name: string;
  description: string;
  location: string;
  price_per_hour: number;
  capacity: number;
  rating: number;
  images: string[];
  facilities: string[];
  created_at: string;
}

export interface TimeSlot {
  id: string;
  field_id: string;
  date: string;
  time: string;
  available: boolean;
}

export interface Booking {
  id: string;
  user_id: string;
  field_id: string;
  date: string;
  time_slot: string;
  status: 'pending' | 'pending_payment' | 'confirmed' | 'cancelled';
  payment_method: 'wave' | 'orange_money' | 'cash';
  amount: number;
  payment_status?: 'unpaid' | 'partial' | 'paid';
  payment_date?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  method: string;
  status: 'pending' | 'completed' | 'failed';
  amount: number;
  created_at: string;
}

export interface BookingWithField extends Booking {
  field?: Field;
  user?: User;
}

export interface Review {
  id: string;
  field_id: string;
  user_id: string | null; // null for anonymous reviews
  rating: number;
  comment: string;
  admin_reply?: string | null;
  admin_id?: string | null;
  admin_replied_at?: string | null;
  created_at: string;
  updated_at: string;
  user?: User | null;
  admin?: User | null; // Admin who replied
  reviewer_name?: string; // For anonymous reviews
  reviewer_email?: string | null; // For anonymous reviews
}

export interface BlockedSlot {
  id: string;
  field_id: string;
  date: string;
  start_time: string;
  end_time: string;
  full_day: boolean;
  reason?: string;
  created_by?: string;
  created_at: string;
}
