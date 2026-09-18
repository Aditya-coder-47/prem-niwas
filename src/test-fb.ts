import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const config = {
  apiKey: "AIzaSyBKj92EaU5NJ80-jrLL8phiBZWUa3-El5Y",
  authDomain: "prem-niwas.firebaseapp.com",
  projectId: "prem-niwas",
  storageBucket: "prem-niwas.firebasestorage.app",
  messagingSenderId: "529430145969",
  appId: "1:529430145969:web:abf399819e5d83d862ab90"
};

const app = initializeApp(config);
const db = getFirestore(app);

async function test() {
  try {
    const snap = await getDocs(collection(db, 'rooms'));
    console.log('Success! Rooms count:', snap.size);
  } catch (err: any) {
    console.error('Firebase Error:', err.message);
  }
}

test();
