import { db } from './firebase-config.js';
import { collection, addDoc, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export async function initializeDatabase() {
    // Check if database is already initialized
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    if (usersSnapshot.empty) {
        try {
            // Create sample teacher
            await addDoc(collection(db, 'users'), {
                firstName: 'أستاذ',
                lastName: 'نموذجي',
                email: 'teacher@example.com',
                role: 'teacher',
                createdAt: new Date(),
                lastLogin: new Date()
            });

            // Create sample student
            await addDoc(collection(db, 'users'), {
                firstName: 'طالب',
                lastName: 'نموذجي',
                email: 'student@example.com',
                role: 'student',
                createdAt: new Date(),
                lastLogin: new Date()
            });

            // Create sample class
            await addDoc(collection(db, 'classes'), {
                title: 'حصة تجريبية',
                teacherId: 'teacher@example.com',
                date: new Date(),
                time: '10:00',
                duration: 60,
                description: 'حصة تجريبية للنظام'
            });

            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Error initializing database:', error);
        }
    }
}

export async function getUser(userId) {
    const q = query(collection(db, 'users'), where('email', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs[0]?.data();
}

export async function getClasses(teacherId = null) {
    let q;
    if (teacherId) {
        q = query(collection(db, 'classes'), where('teacherId', '==', teacherId));
    } else {
        q = query(collection(db, 'classes'));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
}

export async function getAttendance(studentId, date = null) {
    let q;
    if (date) {
        q = query(collection(db, 'attendance'), 
            where('studentId', '==', studentId),
            where('date', '==', date));
    } else {
        q = query(collection(db, 'attendance'), 
            where('studentId', '==', studentId));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
}

export async function getNotes(studentId, teacherId = null) {
    let q;
    if (teacherId) {
        q = query(collection(db, 'notes'),
            where('studentId', '==', studentId),
            where('teacherId', '==', teacherId));
    } else {
        q = query(collection(db, 'notes'),
            where('studentId', '==', studentId));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
}
