const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  try {
    console.log('🌱 Starting database seed...\n');

    // 1. Seed Users
    console.log('👥 Seeding users...');
    const users = [
      {
        email: 'admin@sport.sn',
        name: 'Admin User',
        phone: '+221771234567',
        role: 'admin',
      },
      {
        email: 'user@test.com',
        name: 'Test User',
        phone: '+221771234568',
        role: 'user',
      },
      {
        email: 'john@example.com',
        name: 'John Doe',
        phone: '+221771234569',
        role: 'user',
      },
      {
        email: 'marie@example.com',
        name: 'Marie Seck',
        phone: '+221771234570',
        role: 'user',
      },
    ];

    for (const user of users) {
      const { data, error } = await supabase
        .from('users')
        .insert(user)
        .select()
        .single();

      if (error && !error.message.includes('duplicate')) {
        console.error(`Error adding user ${user.email}:`, error);
      } else if (data) {
        console.log(`✓ Added user: ${user.email} (${user.role})`);
      }
    }

    // 2. Seed Fields
    console.log('\n⚽ Seeding football fields...');
    const fields = [
      {
        name: 'Stadium Elite Football Field',
        description: 'Professional-grade football field with modern facilities',
        location: 'Downtown Sports Complex, Thiés',
        price_per_hour: 15000,
        capacity: 18,
        rating: 4.8,
        images: [
          'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800',
          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
        ],
        facilities: ['Floodlights', 'Changing Rooms', 'Parking', 'Refreshments'],
      },
      {
        name: 'Sunset Valley Field',
        description: 'Beautiful field with evening floodlights and great views',
        location: 'Plateau, Thiés',
        price_per_hour: 12000,
        capacity: 20,
        rating: 4.5,
        images: [
          'https://images.unsplash.com/photo-1570902235392-8f6121c2a9f8?w=800',
        ],
        facilities: ['Floodlights', 'Parking', 'Seating Area'],
      },
      {
        name: 'Riverside Sports Arena',
        description: 'Spacious field perfect for tournaments and big games',
        location: 'Île de Gorée, Thiés',
        price_per_hour: 18000,
        capacity: 24,
        rating: 4.9,
        images: [
          'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=800',
        ],
        facilities: [
          'Floodlights',
          'Changing Rooms',
          'Parking',
          'Stadium Seating',
          'Refreshments',
        ],
      },
      {
        name: 'Petite Côte Mini Field',
        description: 'Perfect for casual games and youth tournaments',
        location: 'Petite Côte, Thiés',
        price_per_hour: 8000,
        capacity: 16,
        rating: 4.2,
        images: [
          'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
        ],
        facilities: ['Floodlights', 'Parking'],
      },
      {
        name: 'Grand Yoff Premier Field',
        description: 'Top-tier field with all premium amenities',
        location: 'Grand Yoff, Thiés',
        price_per_hour: 20000,
        capacity: 24,
        rating: 4.9,
        images: [
          'https://images.unsplash.com/photo-1508098682722-e7c75f5f97cc?w=800',
        ],
        facilities: [
          'Floodlights',
          'Changing Rooms',
          'Parking',
          'Stadium Seating',
          'Cafeteria',
          'Medical Room',
        ],
      },
    ];

    let fieldIds: string[] = [];
    for (const field of fields) {
      const { data, error } = await supabase
        .from('fields')
        .insert(field)
        .select('id')
        .single();

      if (error) {
        console.error(`Error adding field ${field.name}:`, error);
      } else if (data) {
        fieldIds.push(data.id);
        console.log(`✓ Added field: ${field.name}`);
      }
    }

    // 3. Seed Time Slots for each field
    console.log('\n🕐 Seeding time slots...');
    const timeSlots = [
      '08:00 - 10:00',
      '10:00 - 12:00',
      '12:00 - 14:00',
      '14:00 - 16:00',
      '16:00 - 18:00',
      '18:00 - 20:00',
      '20:00 - 22:00',
    ];

    const today = new Date();
    const daysToAdd = 30;

    for (const fieldId of fieldIds) {
      let addedCount = 0;
      for (let day = 0; day < daysToAdd; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() + day);
        const dateStr = date.toISOString().split('T')[0];

        for (const slot of timeSlots) {
          const { error } = await supabase.from('time_slots').insert({
            field_id: fieldId,
            date: dateStr,
            time: slot,
            available: Math.random() > 0.3, // 70% available
          });

          if (!error) {
            addedCount++;
          }
        }
      }
      console.log(`✓ Added ${addedCount} time slots for field ${fieldId}`);
    }

    // 4. Seed Sample Bookings
    console.log('\n📅 Seeding sample bookings...');
    const userEmails = ['user@test.com', 'john@example.com', 'marie@example.com'];

    // Get user IDs
    const { data: usersData } = await supabase
      .from('users')
      .select('id, email')
      .in('email', userEmails);

    if (usersData && fieldIds.length > 0) {
      const bookings = [
        {
          user_id: usersData[0]?.id,
          field_id: fieldIds[0],
          date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
          time_slot: '18:00 - 20:00',
          status: 'pending',
          payment_method: 'wave',
          amount: 15000,
        },
        {
          user_id: usersData[1]?.id,
          field_id: fieldIds[1],
          date: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
          time_slot: '16:00 - 18:00',
          status: 'confirmed',
          payment_method: 'orange_money',
          amount: 12000,
        },
        {
          user_id: usersData[2]?.id,
          field_id: fieldIds[2],
          date: new Date(Date.now() + 259200000).toISOString().split('T')[0], // 3 days from now
          time_slot: '10:00 - 12:00',
          status: 'confirmed',
          payment_method: 'cash',
          amount: 18000,
        },
        {
          user_id: usersData[0]?.id,
          field_id: fieldIds[3],
          date: new Date(Date.now() + 345600000).toISOString().split('T')[0], // 4 days from now
          time_slot: '14:00 - 16:00',
          status: 'cancelled',
          payment_method: 'wave',
          amount: 8000,
        },
      ];

      for (const booking of bookings) {
        const { error } = await supabase.from('bookings').insert(booking);
        if (error) {
          console.error('Error adding booking:', error);
        } else {
          console.log(
            `✓ Added booking for field on ${booking.date} at ${booking.time_slot}`
          );
        }
      }
    }

    console.log('\n✅ Database seed completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('  Regular User: user@test.com / test123');
    console.log('  Admin User: admin@sport.sn / admin123');
    console.log('\n');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
