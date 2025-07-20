// Firebase Configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore, collection, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration object
const firebaseConfig = {
    apiKey: "AIzaSyCO54SQWfIPTL4lWgAJObXQWcxF3RCPOEs",
    authDomain: "quran-8af1a.firebaseapp.com",
    projectId: "quran-8af1a",
    storageBucket: "quran-8af1a.firebasestorage.app",
    messagingSenderId: "898962069347",
    appId: "1:898962069347:web:bbb097e0a9acdce278e556",
    measurementId: "G-XE7LDEV3Q1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize database collections if they don't exist
export async function initializeCollections() {
    try {
        // Create classes collection
        await setDoc(doc(db, '_schema', 'classes'), {
            fields: {
                title: 'string',
                date: 'date',
                time: 'string',
                duration: 'number',
                description: 'string',
                teacherId: 'string',
                createdAt: 'date'
            }
        });

        // Create attendance collection
        await setDoc(doc(db, '_schema', 'attendance'), {
            fields: {
                studentId: 'string',
                classId: 'string',
                date: 'date',
                status: 'string'
            }
        });

        // Create notes collection
        await setDoc(doc(db, '_schema', 'notes'), {
            fields: {
                teacherId: 'string',
                studentId: 'string',
                content: 'string',
                date: 'date'
            }
        });

        console.log('Database schema initialized successfully');
    } catch (error) {
        console.error('Error initializing schema:', error);
    }
}

export { app, auth, db };