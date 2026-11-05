const { rtdb } = require('./src/config/firebase');
const bcrypt = require('bcrypt');

async function seed() {
  if (!rtdb) {
    console.error('\n❌ ERROR: Firebase Realtime Database is not initialized!');
    console.error('Please make sure you have:');
    console.error('1. Set FIREBASE_DATABASE_URL in backend/.env');
    console.error('2. Placed serviceAccountKey.json in the backend/ directory (or configured FIREBASE_SERVICE_ACCOUNT_JSON)\n');
    process.exit(1);
  }

  console.log('Seeding Firebase Realtime Database with initial data...');

  try {
    // 1. Seed Admins (Default password: adminpassword123)
    const passwordHash = await bcrypt.hash('adminpassword123', 10);
    const admins = {
      admin1: {
        username: 'admin1',
        password_hash: passwordHash,
        must_change_password: true,
        created_at: Date.now()
      },
      admin2: {
        username: 'admin2',
        password_hash: passwordHash,
        must_change_password: true,
        created_at: Date.now()
      }
    };
    await rtdb.ref('admins').set(admins);
    console.log('✔ Admins created (admin1 & admin2 / adminpassword123)');

    // 2. Seed Rooms
    const rooms = {
      room_1: {
        id: 'room_1',
        room_code: 'ECE-R1',
        room_name: 'Room 1 - Core Electronics',
        time_per_question: 30,
        is_active: true,
        created_at: Date.now()
      },
      room_2: {
        id: 'room_2',
        room_code: 'ECE-R2',
        room_name: 'Room 2 - Communication Systems',
        time_per_question: 30,
        is_active: true,
        created_at: Date.now()
      }
    };
    await rtdb.ref('rooms').set(rooms);
    console.log('✔ Rooms created (ECE-R1 & ECE-R2)');

    // 3. Seed Question Placeholders
    const questions = {
      room_1: {
        q1: {
          id: 'q1',
          question_text: 'What is the barrier potential for Silicon at 300K?',
          option_a: '0.3 V',
          option_b: '0.7 V',
          option_c: '1.1 V',
          option_d: '0.1 V',
          correct_option: 'B',
          marks: 1,
          is_active: true
        },
        q2: {
          id: 'q2',
          question_text: 'Which transistor configuration offers unity voltage gain?',
          option_a: 'Common Base',
          option_b: 'Common Emitter',
          option_c: 'Common Collector',
          option_d: 'None of the above',
          correct_option: 'C',
          marks: 1,
          is_active: true
        },
        q3: {
          id: 'q3',
          question_text: 'In an ideal op-amp, the input impedance is considered to be:',
          option_a: 'Zero',
          option_b: '50 Ohms',
          option_c: 'Infinite',
          option_d: '1 Megaohm',
          correct_option: 'C',
          marks: 1,
          is_active: true
        }
      },
      room_2: {
        q1: {
          id: 'q1',
          question_text: 'For standard AM broadcasting, the modulation index should ideally be:',
          option_a: 'Between 0 and 1',
          option_b: 'Greater than 1',
          option_c: 'Equal to 0',
          option_d: 'Negative',
          correct_option: 'A',
          marks: 1,
          is_active: true
        },
        q2: {
          id: 'q2',
          question_text: 'Nyquist sampling rate for a signal bandwidth of 4 kHz is:',
          option_a: '2 kHz',
          option_b: '4 kHz',
          option_c: '8 kHz',
          option_d: '16 kHz',
          correct_option: 'C',
          marks: 1,
          is_active: true
        }
      }
    };
    await rtdb.ref('questions').set(questions);
    console.log('✔ Question bank populated.');

    console.log('\n🎉 Firebase Realtime Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed with error:', err);
    process.exit(1);
  }
}

seed();
