import { auth, db } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

export async function checkAuth() {
    return new Promise((resolve, reject) => {
        auth.onAuthStateChanged(async (user) => {
            if (!user) {
                window.location.href = '/index.html';
                reject('User not authenticated');
            }
            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                const userData = userDoc.data();
                resolve({ user, role: userData.role });
            } catch (error) {
                console.error('Error getting user data:', error);
                reject(error);
            }
        });
    });
}

export async function checkTeacherAuth() {
    const { role } = await checkAuth();
    if (role !== 'teacher') {
        window.location.href = '/student-dashboard.html';
    }
}

export async function checkStudentAuth() {
    const { role } = await checkAuth();
    if (role !== 'student') {
        window.location.href = '/teacher-dashboard.html';
    }
}

export async function handleLogout() {
    try {
        await auth.signOut();
        window.location.href = '/index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
    }
}
