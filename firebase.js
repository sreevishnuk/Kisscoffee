// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCddkfl0pC5jvjzUCWsthE3nnpZviWakQY",
  authDomain: "kisscoffee-1cf3b.firebaseapp.com",
  projectId: "kisscoffee-1cf3b",
  storageBucket: "kisscoffee-1cf3b.firebasestorage.app",
  messagingSenderId: "452625960403",
  appId: "1:452625960403:web:0ab80bb9c98643f1717326"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, doc, getDoc, setDoc, updateDoc };

// Helper function to get admin document from Firestore
export async function getAdminSettings() {
  console.log('🔍 Fetching admin settings from Firestore...');
  const adminDoc = doc(db, 'admin', 'settings');
  const docSnap = await getDoc(adminDoc);

  if (docSnap.exists()) {
    console.log('✅ Admin settings loaded:', docSnap.data());
    return docSnap.data();
  } else {
    console.log('🆕 Creating default admin settings...');
    // Default settings if no document exists
    const defaultSettings = {
      customMessage: "Welcome to Kiss Coffee! Freshly brewed coffee and homemade treats just for you.",
      openingHours: {
        mondayToFriday: "8am–5pm",
        saturday: "8am–3pm",
        sunday: "Closed"
      },
      services: ["Dine-in", "Takeaway"],
      menu: {
        "Hot Drinks": [
          { name: "Espresso", price: "£2.50" },
          { name: "Americano", price: "£2.80" },
          { name: "Cappuccino", price: "£3.20" },
          { name: "Latte", price: "£3.50" },
          { name: "Flat White", price: "£3.60" },
          { name: "Mocha", price: "£3.80" },
          { name: "Hot Chocolate", price: "£3.40" },
          { name: "Tea (Assorted)", price: "£2.20" }
        ],
        "Cold Drinks": [
          { name: "Iced Coffee", price: "£3.80" },
          { name: "Iced Latte", price: "£4.00" },
          { name: "Iced Cappuccino", price: "£4.00" },
          { name: "Cold Brew", price: "£4.20" },
          { name: "Fruit Smoothie", price: "£4.50" },
          { name: "Sparkling Water", price: "£1.80" },
          { name: "Orange Juice", price: "£3.00" }
        ],
        "Sweet Treats": [
          { name: "Croissant", price: "£2.80" },
          { name: "Chocolate Brownie", price: "£3.50" },
          { name: "Banana Bread", price: "£3.20" },
          { name: "Scone with Clotted Cream", price: "£3.80" },
          { name: "Cheesecake Slice", price: "£4.20" },
          { name: "Cookie (Chocolate Chip)", price: "£1.80" },
          { name: "Cake of the Day", price: "£4.50" }
        ],
        "Savoury Treats": [
          { name: "Breakfast Sandwich", price: "£5.50" },
          { name: "Club Sandwich", price: "£6.50" },
          { name: "Chicken & Avocado Wrap", price: "£6.00" },
          { name: "Quiche of the Day", price: "£5.80" },
          { name: "Soup of the Day", price: "£4.80" },
          { name: "Halloumi Salad", price: "£7.00" },
          { name: "Pastries (Savory)", price: "£3.00" }
        ]
      }
    };
    await setDoc(doc(db, 'admin', 'settings'), defaultSettings);
    console.log('✅ Default settings created!');
    return defaultSettings;
  }
}

// Helper function to save admin settings
export async function saveAdminSettings(settings) {
  console.log('💾 Saving admin settings:', settings);
  const adminDoc = doc(db, 'admin', 'settings');
  try {
    await setDoc(adminDoc, settings, { merge: true });
    console.log('✅ Settings saved successfully!');
    return true;
  } catch (error) {
    console.error('❌ Failed to save settings:', error);
    throw error;
  }
}
