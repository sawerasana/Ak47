/**
 * index.js – Entry Portal Logic
 * - GET ACCESS: shows 2s global loader, then redirect to /auth/signup.html
 * - LOGIN: modal for ID key, validates via PX.getUser(), redirects to /engine/dashboard.html
 */

document.addEventListener('DOMContentLoaded', () => {
    const getAccessBtn = document.getElementById('getAccessBtn');
    const loginBtn = document.getElementById('loginBtn');

    // GET ACCESS button – 2 second loader then redirect
    if (getAccessBtn) {
        getAccessBtn.addEventListener('click', () => {
            PX.showLoader(2000, () => {
                window.location.href = '/auth/signup.html';
            });
        });
    }

    // LOGIN button – open modal for ID key
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            // Create a custom modal with input field
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.innerHTML = `
                <div class="modal-container" style="max-width: 450px;">
                    <h3><i class="fas fa-lock"></i> Enter Your ID Key</h3>
                    <div class="bilingual">
                        <span class="english-text">Please paste your unique access key</span>
                        <span class="urdu-text">براہ کرم اپنی منفرد رسائی کلید پیسٹ کریں</span>
                    </div>
                    <input type="text" id="loginKeyInput" placeholder="Paste your ID key here..." maxlength="99" autocomplete="off">
                    <div class="modal-buttons">
                        <button id="modalCancelBtn" class="btn-secondary">Cancel</button>
                        <button id="modalConfirmBtn" class="btn-primary">Verify & Enter</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            setTimeout(() => overlay.classList.add('active'), 10);

            const input = overlay.querySelector('#loginKeyInput');
            const confirmBtn = overlay.querySelector('#modalConfirmBtn');
            const cancelBtn = overlay.querySelector('#modalCancelBtn');

            const closeModal = () => {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 300);
            };

            confirmBtn.onclick = () => {
                const enteredKey = input.value.trim();
                if (!enteredKey) {
                    PX.showModal(
                        'Input Required',
                        'درج کرنا ضروری ہے',
                        'Please enter your ID key.',
                        'براہ کرم اپنی شناختی کلید درج کریں۔',
                        null,
                        false
                    );
                    return;
                }
                const user = PX.getUser(enteredKey);
                if (user) {
                    // Valid key: set session, show loader, redirect to dashboard
                    PX.setCurrentUser(enteredKey);
                    closeModal();
                    PX.showLoader(1500, () => {
                        window.location.href = '/engine/dashboard.html';
                    });
                } else {
                    // Invalid key
                    PX.showModal(
                        'Invalid Key',
                        'غلط کلید',
                        'No account found with this ID key. Please sign up first.',
                        'اس شناختی کلید سے کوئی اکاؤنٹ نہیں ملا۔ براہ کرم پہلے سائن اپ کریں۔',
                        null,
                        false
                    );
                    input.style.borderColor = '#ff0000';
                    setTimeout(() => { input.style.borderColor = ''; }, 1000);
                }
            };

            cancelBtn.onclick = closeModal;
            input.addEventListener('keypress', (e) => { if (e.key === 'Enter') confirmBtn.click(); });
        });
    }
});
