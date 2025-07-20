// Main Application Logic
import { 
    signInWithEmail, 
    signUpWithEmail, 
    signInWithGoogle,
    createUserProfile,
    getCurrentUser,
    validateTeacherCode 
} from './auth.js';

// Global state
let selectedRole = null;

// DOM elements
const elements = {
    loginModal: document.getElementById('loginModal'),
    registerModal: document.getElementById('registerModal'),
    roleModal: document.getElementById('roleModal'),
    profileModal: document.getElementById('profileModal'),
    loading: document.getElementById('loading'),
    teacherCodeField: document.getElementById('teacherCode')
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeGoogleSignIn();
});

// Initialize event listeners
function initializeEventListeners() {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
    }
    
    // Google Sign In button
    const googleSignInBtn = document.getElementById('googleSignIn');
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', handleGoogleSignIn);
    }
    
    // Modal close events
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.classList.remove('show');
        }
    });
}

// Initialize Google Sign In
function initializeGoogleSignIn() {
    // Google Sign In is handled through Firebase Auth
    console.log('Google Sign In initialized');
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showMessage('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    showLoading(true);
    
    const result = await signInWithEmail(email, password);
    
    showLoading(false);
    
    if (result.success) {
        closeModal('loginModal');
        showMessage('تم تسجيل الدخول بنجاح', 'success');
    } else {
        showMessage(result.error, 'error');
    }
}

// Handle register form submission
async function handleRegister(event) {
    event.preventDefault();
    
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!email || !password || !confirmPassword) {
        showMessage('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('كلمتا المرور غير متطابقتان', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    showLoading(true);
    
    const result = await signUpWithEmail(email, password);
    
    showLoading(false);
    
    if (result.success) {
        closeModal('registerModal');
        showRoleModal();
        showMessage('تم إنشاء الحساب بنجاح', 'success');
    } else {
        showMessage(result.error, 'error');
    }
}

// Handle Google Sign In
async function handleGoogleSignIn() {
    showLoading(true);
    
    const result = await signInWithGoogle();
    
    showLoading(false);
    
    if (result.success) {
        closeModal('loginModal');
        showRoleModal();
        showMessage('تم تسجيل الدخول بنجاح', 'success');
    } else {
        showMessage(result.error, 'error');
    }
}

// Handle profile form submission
async function handleProfileSubmit(event) {
    event.preventDefault();
    
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    const birthDate = document.getElementById('birthDate').value;
    
    if (!firstName || !lastName || !birthDate) {
        showMessage('يرجى ملء جميع الحقول', 'error');
        return;
    }
    
    // Validate teacher access code if role is teacher
    if (selectedRole === 'teacher') {
        const accessCode = document.getElementById('accessCode').value;
        if (!accessCode) {
            showMessage('رمز الدخول مطلوب للأساتذة', 'error');
            return;
        }
        
        if (!validateTeacherCode(accessCode)) {
            showMessage('رمز الدخول غير صحيح', 'error');
            return;
        }
    }
    
    const user = getCurrentUser();
    if (!user) {
        showMessage('خطأ في النظام', 'error');
        return;
    }
    
    showLoading(true);
    
    const profileData = {
        email: user.email,
        firstName,
        lastName,
        birthDate,
        role: selectedRole
    };
    
    const result = await createUserProfile(user.uid, profileData);
    
    showLoading(false);
    
    if (result.success) {
        closeModal('profileModal');
        showMessage('تم حفظ البيانات بنجاح', 'success');
        // The auth state change listener will handle the redirect
    } else {
        showMessage(result.error, 'error');
    }
}

// Role selection
window.selectRole = function(role) {
    selectedRole = role;
    closeModal('roleModal');
    
    if (role === 'teacher') {
        elements.teacherCodeField.style.display = 'block';
        document.getElementById('accessCode').required = true;
    } else {
        elements.teacherCodeField.style.display = 'none';
        document.getElementById('accessCode').required = false;
    }
    
    showProfileModal();
};

// Modal functions
window.showLoginModal = function() {
    elements.loginModal.classList.add('show');
};

window.showRegisterModal = function() {
    elements.registerModal.classList.add('show');
};

function showRoleModal() {
    elements.roleModal.classList.add('show');
}

function showProfileModal() {
    elements.profileModal.classList.add('show');
}

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
};

// Loading state
function showLoading(show) {
    if (show) {
        elements.loading.classList.add('show');
    } else {
        elements.loading.classList.remove('show');
    }
}

// Message display
function showMessage(message, type = 'info') {
    // Create message element
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Style the message
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: 600;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Set colors based on type
    if (type === 'success') {
        messageDiv.style.background = '#C8E6C9';
        messageDiv.style.color = '#2E7D32';
        messageDiv.style.border = '1px solid #4CAF50';
    } else if (type === 'error') {
        messageDiv.style.background = '#FFEBEE';
        messageDiv.style.color = '#C62828';
        messageDiv.style.border = '1px solid #F44336';
    } else {
        messageDiv.style.background = '#E3F2FD';
        messageDiv.style.color = '#1565C0';
        messageDiv.style.border = '1px solid #2196F3';
    }
    
    // Add to document
    document.body.appendChild(messageDiv);
    
    // Animate in
    setTimeout(() => {
        messageDiv.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after delay
    setTimeout(() => {
        messageDiv.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 300);
    }, 3000);
}

// Form validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

// Utility functions
function formatDate(date) {
    return new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(date));
}

function formatTime(time) {
    return new Intl.DateTimeFormat('ar-SA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(new Date(`2000-01-01T${time}`));
}

// Export functions for global access
window.showMessage = showMessage;
window.formatDate = formatDate;
window.formatTime = formatTime;