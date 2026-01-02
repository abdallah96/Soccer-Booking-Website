export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin';
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
  status: 'pending' | 'confirmed' | 'cancelled';
  payment_method: 'wave' | 'orange_money' | 'cash';
  amount: number;
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
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  updated_at: string;
  user?: User;
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
