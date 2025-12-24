import { GET } from './route';
import { createClient } from '@/lib/supabase/server';
import { PETIT_CAMP_FIELD } from '@/lib/utils/constants';
import { NextResponse } from 'next/server';

// Mock the dependencies
jest.mock('@/lib/supabase/server');
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data) => ({ json: () => Promise.resolve(data) })),
  },
}));

describe('/api/fields route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return fields with Petit Camp having capacity 18', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    };

    const mockFields = [
      {
        id: 'petit-camp-1',
        name: 'Petit Camp',
        description: 'Terrain de football professionnel',
        location: 'Thiés, Sénégal',
        price_per_hour: 20000,
        capacity: 18, // Correct capacity
        rating: 4.8,
        images: [],
        facilities: ['Éclairage', 'Vestiaires'],
        created_at: '2024-01-01T00:00:00Z',
      },
    ];

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.order.mockResolvedValue({
      data: mockFields,
      error: null,
    });

    const response = await GET();
    const data = await response.json();

    expect(data.fields).toBeDefined();
    expect(data.fields.length).toBeGreaterThan(0);
    
    const petitCampField = data.fields.find((f: any) => f.name === 'Petit Camp');
    expect(petitCampField).toBeDefined();
    expect(petitCampField.capacity).toBe(18);
  });

  it('should update Petit Camp capacity to 18 if it is not 18', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    };

    const mockFields = [
      {
        id: 'petit-camp-1',
        name: 'Petit Camp',
        capacity: 22, // Wrong capacity
        price_per_hour: 20000,
        images: [],
      },
    ];

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.order.mockResolvedValue({
      data: mockFields,
      error: null,
    });
    mockSupabase.eq.mockResolvedValue({});

    const response = await GET();
    const data = await response.json();

    // Should have updated the capacity
    expect(mockSupabase.update).toHaveBeenCalledWith({ capacity: 18 });
    expect(mockSupabase.eq).toHaveBeenCalledWith('name', 'Petit Camp');
  });

  it('should return fallback Petit Camp field if database is empty', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);

    const response = await GET();
    const data = await response.json();

    expect(data.fields).toBeDefined();
    expect(data.fields.length).toBe(1);
    expect(data.fields[0].name).toBe(PETIT_CAMP_FIELD.name);
    expect(data.fields[0].capacity).toBe(18);
  });
});

