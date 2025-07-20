// Student Dashboard Logic
import { auth, db } from './firebase-config.js';
import { collection, addDoc, getDocs, query, where, doc, getDoc, deleteDoc, orderBy } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

let currentStudentId = null;

// Initialize dashboard
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentStudentId = user.uid;
        await loadStudentData();
        await checkTodayAttendance();
        await loadSchedule();
        await loadTeacherNotes();
    } else {
        window.location.href = '/';
    }
});

async function loadStudentData() {
    const studentDoc = await getDoc(doc(db, 'users', currentStudentId));
    const studentData = studentDoc.data();
    document.getElementById('userName').textContent = `${studentData.firstName} ${studentData.lastName}`;
}

async function checkTodayAttendance() {
    const today = new Date().toISOString().split('T')[0];
    const attendanceQuery = query(collection(db, 'attendance'),
        where('studentId', '==', currentStudentId),
        where('date', '==', today));
    
    const snapshot = await getDocs(attendanceQuery);
    const attendanceStatus = document.getElementById('attendanceStatus');
    const markAttendanceBtn = document.getElementById('markAttendanceBtn');
    
    if (!snapshot.empty) {
        attendanceStatus.innerHTML = '<p class="success">تم تسجيل حضورك اليوم</p>';
        markAttendanceBtn.disabled = true;
    }
}

async function markAttendance() {
    try {
        await addDoc(collection(db, 'attendance'), {
            studentId: currentStudentId,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString(),
            status: 'present'
        });
        await checkTodayAttendance();
    } catch (error) {
        alert('Error marking attendance: ' + error.message);
    }
}

async function loadSchedule() {
    const scheduleContent = document.getElementById('scheduleContent');
    
    scheduleContent.innerHTML = `
        <div class="loading-container">
            <div class="pulse-loader"></div>
        </div>
    `;
    
    try {
        const classesRef = collection(db, 'classes');
        const snapshot = await getDocs(classesRef);
        
        let scheduleHTML = '<div class="schedule-grid fade-enter">';
        snapshot.forEach(doc => {
            const classData = doc.data();
            const classDate = new Date(classData.date);
            scheduleHTML += `
                <div class="schedule-card">
                    <div class="schedule-time">
                        <span class="time">${classData.time || 'غير محدد'}</span>
                        <span class="date">${classDate.toLocaleDateString('ar-SA')}</span>
                    </div>
                    <div class="schedule-details">
                        <h4>${classData.title || 'بدون عنوان'}</h4>
                        <div class="schedule-meta">
                            <span class="duration">
                                <i class="icon">⏱️</i> ${classData.duration || 0} دقيقة
                            </span>
                        </div>
                        ${classData.description ? 
                            `<p class="description">${classData.description}</p>` : 
                            ''}
                    </div>
                </div>
            `;
        });
        scheduleHTML += '</div>';
        
        scheduleContent.innerHTML = scheduleHTML;
        // Trigger reflow for animation
        requestAnimationFrame(() => {
            const grid = scheduleContent.querySelector('.schedule-grid');
            grid.classList.add('fade-enter-active');
        });
    } catch (error) {
        console.error('Error loading schedule:', error);
        scheduleContent.innerHTML = `
            <div class="error-message fade-enter fade-enter-active">
                <p>عذراً، حدث خطأ في تحميل الجدول</p>
            </div>
        `;
    }
}

async function loadTeacherNotes() {
    const notesContent = document.getElementById('teacherNotes');
    
    try {
        notesContent.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>جاري تحميل الملاحظات...</p>
            </div>
        `;

        const notesQuery = query(
            collection(db, 'teacher_notes'),
            where('studentId', '==', currentStudentId),
            orderBy('date', 'desc')
        );
        
        const snapshot = await getDocs(notesQuery);
        
        if (snapshot.empty) {
            notesContent.innerHTML = '<p class="no-data">لا توجد ملاحظات من الأستاذ</p>';
            return;
        }

        let notesHTML = '';
        for (const doc of snapshot.docs) {
            const noteData = doc.data();
            notesHTML += `
                <div class="note-item">
                    <div class="note-content">${noteData.content}</div>
                    <div class="note-meta">
                        <small>${new Date(noteData.date).toLocaleDateString('ar-SA')}</small>
                    </div>
                </div>
            `;
        }
        
        notesContent.innerHTML = notesHTML;
    } catch (error) {
        console.error('Error loading teacher notes:', error);
        notesContent.innerHTML = '<p class="error">حدث خطأ في تحميل الملاحظات</p>';
    }
}

async function deleteAccount() {
    try {
        document.getElementById('loading').style.display = 'flex';
        
        // Delete user document from Firestore
        await deleteDoc(doc(db, 'users', currentStudentId));
        
        // Delete user authentication
        const user = auth.currentUser;
        if (user) {
            await user.delete();
        }
        
        alert('تم حذف حسابك بنجاح');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error deleting account:', error);
        alert('حدث خطأ أثناء حذف الحساب: ' + error.message);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

async function addNoteToTeacher() {
    const noteContent = document.getElementById('studentNoteContent').value.trim();
    if (!noteContent) {
        alert('الرجاء كتابة الملاحظة أولاً');
        return;
    }

    try {
        document.getElementById('loading').style.display = 'flex';
        await addDoc(collection(db, 'student_notes'), {
            studentId: currentStudentId,
            content: noteContent,
            date: new Date().toISOString(),
            read: false
        });
        
        document.getElementById('studentNoteContent').value = '';
        alert('تم إرسال ملاحظتك بنجاح');
    } catch (error) {
        console.error('Error adding note:', error);
        alert('حدث خطأ في إرسال الملاحظة');
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Modal functions
function showDeleteAccountModal() {
    const modal = document.getElementById('deleteAccountModal');
    modal.style.display = 'flex';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
}

// Update event listener
document.getElementById('deleteAccountForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (confirm('هل أنت متأكد من حذف حسابك نهائياً؟ لا يمكن التراجع عن هذا الإجراء.')) {
        await deleteAccount();
    }
});

window.markAttendance = markAttendance;
window.deleteAccount = deleteAccount;
window.showTodaySchedule = loadSchedule;
window.showWeeklySchedule = loadSchedule; // You can modify this to show weekly view
window.addNoteToTeacher = addNoteToTeacher;
window.showDeleteAccountModal = showDeleteAccountModal;
window.closeModal = closeModal;