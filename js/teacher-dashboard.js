// Teacher Dashboard Logic
import { auth, db, initializeCollections } from './firebase-config.js';
import { collection, addDoc, getDocs, query, where, doc, getDoc, orderBy, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Initialize collections when dashboard loads
window.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeCollections();
    } catch (error) {
        console.error('Error initializing collections:', error);
    }
});

let currentTeacherId = null;

// Initialize dashboard
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentTeacherId = user.uid;
        await loadTeacherData();
        await updateStatistics();
        await loadStudents();
        await loadSchedule();
        await loadAttendanceByDate(); // Add this line
        await loadStudentNotes();
    } else {
        window.location.href = 'index.html';
    }
});

// Update schedule form submission
document.getElementById('scheduleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const classData = {
        title: document.getElementById('classTitle').value,
        date: document.getElementById('classDate').value,
        time: document.getElementById('classTime').value,
        duration: parseInt(document.getElementById('classDuration').value),
        description: document.getElementById('classDescription').value,
        teacherId: auth.currentUser.uid,
        createdAt: new Date()
    };

    try {
        document.getElementById('loading').style.display = 'flex';
        
        // Ensure collections are initialized
        await initializeCollections();
        
        // Add the class
        const docRef = await addDoc(collection(db, 'classes'), classData);
        console.log('Class added with ID:', docRef.id);
        
        document.getElementById('scheduleForm').reset();
        closeModal('addScheduleModal');
        await loadSchedule();
        alert('تم إضافة الحصة بنجاح');
    } catch (error) {
        console.error('Error adding class:', error);
        alert('خطأ في إضافة الحصة: ' + error.message);
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
});

async function loadSchedule() {
    const scheduleList = document.getElementById('scheduleList');
    
    scheduleList.innerHTML = `
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
            console.log('Processing class:', doc.id, classData); // Debug: log each class
            
            const classDate = new Date(classData.date);
            scheduleHTML += `
                <div class="schedule-item">
                    <h4>${classData.title || 'بدون عنوان'}</h4>
                    <p>التاريخ: ${classDate.toLocaleDateString('ar-SA')}</p>
                    <p>الوقت: ${classData.time || 'غير محدد'}</p>
                    <p>المدة: ${classData.duration || 0} دقيقة</p>
                    ${classData.description ? `<p>الوصف: ${classData.description}</p>` : ''}
                    <small>معرف الحصة: ${doc.id}</small>
                </div>
            `;
        });
        scheduleHTML += '</div>';
        
        scheduleList.innerHTML = scheduleHTML;
        // Trigger reflow for animation
        requestAnimationFrame(() => {
            const grid = scheduleList.querySelector('.schedule-grid');
            grid.classList.add('fade-enter-active');
        });
    } catch (error) {
        console.error('Error loading schedule:', error);
        scheduleList.innerHTML = `
            <div class="error-message fade-enter fade-enter-active">
                <p>عذراً، حدث خطأ في تحميل الجدول</p>
            </div>
        `;
    }
}

async function loadTeacherData() {
    try {
        const teacherDoc = await getDoc(doc(db, 'users', currentTeacherId));
        const teacherData = teacherDoc.data();
        if (teacherData) {
            document.getElementById('userName').textContent = `${teacherData.firstName} ${teacherData.lastName}`;
        }
    } catch (error) {
        console.error('Error loading teacher data:', error);
    }
}

async function updateStatistics() {
    try {
        // Get today's unique attendance count
        const today = new Date().toISOString().split('T')[0];
        const attendanceQuery = query(
            collection(db, 'attendance'),
            where('date', '==', today)
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);
        
        // Count unique students for today
        const uniqueStudentsToday = new Set(
            attendanceSnapshot.docs.map(doc => doc.data().studentId)
        );
        document.getElementById('todayAttendance').textContent = uniqueStudentsToday.size;

        // Get total students
        const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
        const studentsSnapshot = await getDocs(studentsQuery);
        document.getElementById('totalStudents').textContent = studentsSnapshot.size;

        // Get weekly classes
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const classesQuery = query(
            collection(db, 'classes'),
            where('date', '>=', weekStart.toISOString().split('T')[0])
        );
        const classesSnapshot = await getDocs(classesQuery);
        document.getElementById('weeklyClasses').textContent = classesSnapshot.size;
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

async function loadStudents() {
    try {
        const studentSelect = document.getElementById('studentSelect');
        if (!studentSelect) {
            console.error('Student select element not found');
            return;
        }

        const studentsQuery = query(collection(db, 'users'), where('role', '==', 'student'));
        const snapshot = await getDocs(studentsQuery);
        
        studentSelect.innerHTML = '<option value="">اختر طالباً</option>';
        
        if (!snapshot.empty) {
            snapshot.forEach(doc => {
                const studentData = doc.data();
                if (studentData.firstName && studentData.lastName) {
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = `${studentData.firstName} ${studentData.lastName}`;
                    studentSelect.appendChild(option);
                }
            });
        }
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

async function loadAttendanceByDate() {
    const attendanceList = document.getElementById('attendanceList');
    const today = new Date().toISOString().split('T')[0];
    
    try {
        attendanceList.innerHTML = `
            <div class="modern-loader">
                <div class="dot-pulse"></div>
                <p class="loading-text">جاري تحميل سجل الحضور</p>
            </div>
        `;

        const attendanceQuery = query(
            collection(db, 'attendance'),
            where('date', '==', today)
        );

        const attendanceSnapshot = await getDocs(attendanceQuery);

        if (attendanceSnapshot.empty) {
            attendanceList.innerHTML = '<p class="no-data">لا يوجد حضور مسجل لهذا اليوم</p>';
            return;
        }

        // Create a Map to store unique students with their latest attendance
        const uniqueStudents = new Map();
        
        // Process all attendance records
        for (const attendanceDoc of attendanceSnapshot.docs) {
            const attendanceData = attendanceDoc.data();
            // Only keep the latest attendance for each student
            if (!uniqueStudents.has(attendanceData.studentId) || 
                attendanceData.time > uniqueStudents.get(attendanceData.studentId).time) {
                uniqueStudents.set(attendanceData.studentId, attendanceData);
            }
        }

        let attendanceHTML = '<div class="attendance-grid">';
        
        // Get student details for unique attendances
        for (const [studentId, attendanceData] of uniqueStudents) {
            try {
                const studentRef = doc(db, 'users', studentId);
                const studentSnap = await getDoc(studentRef);
                
                if (studentSnap.exists()) {
                    const studentData = studentSnap.data();
                    attendanceHTML += `
                        <div class="attendance-item">
                            <div class="student-info">
                                <span class="student-name">${studentData.firstName} ${studentData.lastName}</span>
                                <span class="attendance-time">${attendanceData.time}</span>
                            </div>
                            <div class="attendance-status">✓</div>
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error fetching student data:', error);
            }
        }
        
        attendanceHTML += '</div>';
        attendanceHTML += `<div class="attendance-summary">إجمالي الحضور: ${uniqueStudents.size} طالب</div>`;
        attendanceList.innerHTML = attendanceHTML;

    } catch (error) {
        console.error('Error loading attendance:', error);
        attendanceList.innerHTML = '<p class="error">حدث خطأ في تحميل سجل الحضور</p>';
    }
}

async function loadStudentNotes() {
    const notesContainer = document.getElementById('studentNotesContainer');
    if (!notesContainer) return;
    
    try {
        notesContainer.innerHTML = `
            <div class="modern-loader">
                <div class="dot-pulse"></div>
                <p class="loading-text">جاري تحميل الملاحظات</p>
            </div>
        `;
        
        const notesQuery = query(
            collection(db, 'student_notes'),
            orderBy('date', 'desc')
        );
        
        const [notesSnapshot, studentsSnapshot] = await Promise.all([
            getDocs(notesQuery),
            getDocs(collection(db, 'users'))
        ]);
        
        if (notesSnapshot.empty) {
            notesContainer.innerHTML = '<p class="no-data">لا توجد ملاحظات من الطلاب</p>';
            return;
        }

        // Create a map of student data for quick lookup
        const studentsMap = new Map();
        studentsSnapshot.forEach(doc => {
            studentsMap.set(doc.id, doc.data());
        });

        let notesHTML = '<div class="student-notes-list">';
        
        for (const noteDoc of notesSnapshot.docs) {
            const noteData = noteDoc.data();
            const studentData = studentsMap.get(noteData.studentId) || {};
            
            notesHTML += `
                <div class="note-card ${!noteData.read ? 'unread' : ''}">
                    <div class="note-header">
                        <span class="student-name">${studentData.firstName || 'غير معروف'} ${studentData.lastName || ''}</span>
                        <span class="note-date">${new Date(noteData.date).toLocaleDateString('ar-SA')}</span>
                    </div>
                    <div class="note-content">${noteData.content || ''}</div>
                </div>
            `;
        }
        
        notesHTML += '</div>';
        notesContainer.innerHTML = notesHTML;
        
    } catch (error) {
        console.error('Error loading student notes:', error);
        if (notesContainer) {
            notesContainer.innerHTML = '<p class="error">حدث خطأ في تحميل الملاحظات</p>';
        }
    }
}

async function deleteAccount() {
    try {
        document.getElementById('loading').style.display = 'flex';
        
        // Delete teacher document from Firestore
        await deleteDoc(doc(db, 'users', currentTeacherId));
        
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

async function addNoteToStudent() {
    const studentId = document.getElementById('studentSelect').value;
    const noteContent = document.getElementById('teacherNoteContent').value.trim();
    
    if (!studentId) {
        alert('الرجاء اختيار طالب أولاً');
        return;
    }
    if (!noteContent) {
        alert('الرجاء كتابة الملاحظة');
        return;
    }

    try {
        document.getElementById('loading').style.display = 'flex';
        await addDoc(collection(db, 'teacher_notes'), {
            studentId: studentId,
            teacherId: currentTeacherId,
            content: noteContent,
            date: new Date().toISOString()
        });
        
        document.getElementById('teacherNoteContent').value = '';
        alert('تم إضافة الملاحظة بنجاح');
    } catch (error) {
        console.error('Error adding note:', error);
        alert('حدث خطأ في إضافة الملاحظة');
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Show notes section when student is selected
document.getElementById('studentSelect')?.addEventListener('change', (e) => {
    const notesSection = document.getElementById('notesSection');
    notesSection.style.display = e.target.value ? 'block' : 'none';
});

// Make functions available globally
window.loadSchedule = loadSchedule;
window.loadAttendanceByDate = loadAttendanceByDate;
window.loadStudentNotes = loadStudentNotes;

// Make modal functions global
window.showAddScheduleModal = function() {
    const modal = document.getElementById('addScheduleModal');
    modal.style.display = 'flex';
};

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
};

// Make the function globally available
window.deleteAccount = deleteAccount;
window.addNoteToStudent = addNoteToStudent;