const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getDatabase, ref, set } = require('firebase/database');

// Manual configuration - GANTI dengan config Anda
const firebaseConfig = {
  apiKey: "AIzaSyC9o3WZzKi3kLS_9CACDgwcy1pIRPx1vTQ",
  authDomain: "asparagus-proyek.firebaseapp.com",
  databaseURL: "https://asparagus-proyek-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "asparagus-proyek",
  storageBucket: "asparagus-proyek.firebasestorage.app",
  messagingSenderId: "1017031355468",
  appId: "1:1017031355468:web:00b4a13138f70f77ffd8e9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

const users = [
  { email: 'admin@asparagus.com', password: 'admin123', role: 'admin', name: 'Administrator' },
  { email: 'petani1@asparagus.com', password: 'password1', role: 'petani', name: 'Petani 1', petaniId: 1 },
  { email: 'petani2@asparagus.com', password: 'password2', role: 'petani', name: 'Petani 2', petaniId: 2 },
  { email: 'petani3@asparagus.com', password: 'password3', role: 'petani', name: 'Petani 3', petaniId: 3 }
];

// Helper function untuk membuat key yang valid
function createValidKey(timestamp) {
  // Ganti karakter yang tidak diizinkan dengan underscore
  return timestamp.replace(/[\.\#\$\/\[\]]/g, '_');
}

async function setupUsers() {
  console.log('Starting user setup...');
  
  // Login sebagai admin terlebih dahulu
  try {
    console.log('Logging in as admin...');
    const adminCredential = await signInWithEmailAndPassword(auth, 'admin@asparagus.com', 'admin123');
    console.log('✓ Admin login successful');
  } catch (error) {
    console.log('Admin not found, creating admin first...');
  }

  for (const user of users) {
    try {
      console.log(`Creating user: ${user.email}`);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      const firebaseUser = userCredential.user;
      
      console.log(`✓ User ${user.email} created with UID: ${firebaseUser.uid}`);
      
      // Store user data in Realtime Database
      const userData = {
        email: user.email,
        role: user.role,
        name: user.name,
        petaniId: user.petaniId,
        createdAt: new Date().toISOString()
      };
      
      await set(ref(database, `users/${firebaseUser.uid}`), userData);
      console.log(`✓ User data for ${user.email} stored in database`);
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`ℹ User ${user.email} already exists, skipping creation`);
      } else {
        console.error(`✗ Error creating user ${user.email}:`, error.message);
      }
    }
  }

  // Login sebagai admin untuk membuat sample data
  try {
    console.log('Logging in as admin to create sample data...');
    const adminCredential = await signInWithEmailAndPassword(auth, 'admin@asparagus.com', 'admin123');
    console.log('✓ Admin login successful for data creation');
    
    // Create sample data untuk setiap petani
    for (let i = 1; i <= 3; i++) {
      try {
        console.log(`Creating sample data for Petani ${i}...`);
        
        // Sample realtime data
        const realtimeData = {
          temperature: 25 + Math.floor(Math.random() * 10),
          soil_moisture: 40 + Math.floor(Math.random() * 40),
          device_status: 'online',
          last_seen: new Date().toISOString()
        };
        
        await set(ref(database, `petani_${i}/realtime_data`), realtimeData);
        console.log(`✓ Sample realtime data created for Petani ${i}`);

        // Sample history data dengan key yang valid
        const today = new Date().toISOString().split('T')[0];
        const currentTime = new Date().toISOString();
        const validTimeKey = createValidKey(currentTime);
        
        const historyData = {
          [today]: {
            [validTimeKey]: {
              temperature: 26,
              soil_moisture: 65,
              event: 'manual_watering_start',
              duration_minutes: 15,
              timestamp: currentTime
            }
          }
        };
        
        await set(ref(database, `petani_${i}/history_data`), historyData);
        console.log(`✓ Sample history data created for Petani ${i}`);

        // Sample pencatatan data dengan key yang valid
        const record1Key = `record_${Date.now()}_1`;
        const record2Key = `record_${Date.now()}_2`;
        
        const pencatatanData = {
          [record1Key]: {
            tanggal: new Date().toISOString().split('T')[0],
            kelas: 'a',
            jumlah: 15,
            status: 'verified',
            createdAt: new Date().toISOString(),
            createdBy: `Petani ${i}`,
            verifiedBy: 'Administrator',
            verifiedAt: new Date().toISOString()
          },
          [record2Key]: {
            tanggal: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Kemarin
            kelas: 'b',
            jumlah: 12,
            status: 'pending',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            createdBy: `Petani ${i}`
          }
        };
        
        await set(ref(database, `petani_${i}/pencatatan`), pencatatanData);
        console.log(`✓ Sample pencatatan data created for Petani ${i}`);

      } catch (error) {
        console.error(`✗ Error creating sample data for Petani ${i}:`, error.message);
        console.error('Error details:', error);
      }
    }
    
  } catch (error) {
    console.error('Error logging in as admin:', error.message);
  }

  console.log('Setup completed!');
}

// Jalankan setup
setupUsers().catch(console.error);