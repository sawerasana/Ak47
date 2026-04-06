/**
 * global.js - PeshoX Intelligence Master Controller
 * Central configuration, localStorage vault, key generators, modal/loader system
 */

(function() {
    // ========== 1. CENTRAL CONFIGURATION ==========
    window.PX_CONFIG = {
        ownerWhatsApp: '923128942224',
        whatsappChannel: 'https://whatsapp.com/channel/0029Vb781b08fewrKeUT7m1a',
        brandName: 'PESHOX INTELLIGENCE',
        footerCredit: '@darkecho',
        easypaisaNumber: '03469393997',
        planPrices: { basic: 7000, standard: 22000, premium: 33000 },
        keyLengths: { basic: 33, standard: 44, premium: 55 },
        planHours: { basic: 0.5, standard: 24, premium: 72 },
        walletBonus: 5000,
        trxSuccessAttempt: 3,
        mainLoadingSec: 20,
        stepTransitionMs: 2000,
        predictionCooldownSec: 5,
        inviteCooldownHours: 24,
        inviteTargetShares: 5,
        pakistanCode: '+92',
        pakistanLength: 13,
        radarMultipliers: {
            low:  { min: 1.00, max: 10.00, weight: 0.80 },
            mid:  { min: 10.01, max: 30.00, weight: 0.15 },
            high: { min: 30.01, max: 60.00, weight: 0.05 }
        }
    };

    // ========== 2. LOCALSTORAGE VAULT ==========
    const STORAGE = {
        USER_KEY: '_px_user',
        USERS_DB: '_px_users',
        WALLET: '_px_wallet',
        SUBS: '_px_sub'
    };

    function getUsers() {
        const data = localStorage.getItem(STORAGE.USERS_DB);
        return data ? JSON.parse(data) : {};
    }

    function saveUser(userKey, profile) {
        const users = getUsers();
        users[userKey] = { ...(users[userKey] || {}), ...profile, lastUpdated: Date.now() };
        localStorage.setItem(STORAGE.USERS_DB, JSON.stringify(users));
    }

    function getUser(userKey) {
        return getUsers()[userKey] || null;
    }

    function getCurrentUserKey() {
        return localStorage.getItem(STORAGE.USER_KEY);
    }

    function setCurrentUser(userKey) {
        localStorage.setItem(STORAGE.USER_KEY, userKey);
    }

    function logout() {
        localStorage.removeItem(STORAGE.USER_KEY);
        window.location.href = '/';
    }

    function checkAuth(redirectTo = '/') {
        const key = getCurrentUserKey();
        if (!key || !getUser(key)) {
            window.location.href = redirectTo;
            return false;
        }
        return true;
    }

    function getWalletBalance() {
        return parseInt(localStorage.getItem(STORAGE.WALLET) || '0');
    }
    function setWalletBalance(amount) {
        localStorage.setItem(STORAGE.WALLET, amount);
    }
    function addToWallet(amount) {
        const current = getWalletBalance();
        setWalletBalance(current + amount);
    }

    function getSubscription() {
        const userKey = getCurrentUserKey();
        if (!userKey) return null;
        const subs = JSON.parse(localStorage.getItem(STORAGE.SUBS) || '{}');
        return subs[userKey] || null;
    }

    function saveSubscription(expiry, plan) {
        const userKey = getCurrentUserKey();
        if (!userKey) return;
        const subs = JSON.parse(localStorage.getItem(STORAGE.SUBS) || '{}');
        subs[userKey] = { expiry, plan };
        localStorage.setItem(STORAGE.SUBS, JSON.stringify(subs));
    }

    function isSubscriptionActive() {
        const sub = getSubscription();
        return sub && sub.expiry && Date.now() < sub.expiry;
    }

    // ========== 3. KEY GENERATORS ==========
    function generateKey(length) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?/`~ ';
        let key = '';
        for (let i = 0; i < length; i++) {
            key += chars[Math.floor(Math.random() * chars.length)];
        }
        return key;
    }
    const generateKey99 = () => generateKey(99);
    const generateKey33 = () => generateKey(33);
    const generateKey44 = () => generateKey(44);
    const generateKey55 = () => generateKey(55);

    function isValidKey(key, expectedLen) {
        if (!key || key.length !== expectedLen) return false;
        const hasLetter = /[A-Za-z]/.test(key);
        const hasNumber = /[0-9]/.test(key);
        const hasSymbol = /[!@#$%^&*()_+[\]{}|;:,.<>?/`~]/.test(key);
        const hasSpace = / /.test(key);
        return hasLetter && hasNumber && hasSymbol && hasSpace;
    }

    // ========== 4. MODAL & LOADER SYSTEM ==========
    function showLoader(durationMs, onComplete) {
        const existing = document.querySelector('.global-loader-overlay');
        if (existing) existing.remove();
        const overlay = document.createElement('div');
        overlay.className = 'global-loader-overlay';
        overlay.innerHTML = `
            <div class="loader-container">
                <div class="loader-spinner"></div>
                <div class="bilingual">
                    <span class="english-text">Processing...</span>
                    <span class="urdu-text">عمل جاری ہے...</span>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        setTimeout(() => overlay.classList.add('active'), 10);
        setTimeout(() => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
            if (onComplete) onComplete();
        }, durationMs);
    }

    function showModal(englishTitle, urduTitle, englishBody, urduBody, onConfirm = null, showCancel = true) {
        const existing = document.querySelector('.modal-overlay');
        if (existing) existing.remove();
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-container">
                <h3><i class="fas fa-info-circle"></i> ${englishTitle}</h3>
                <h3 style="font-family: 'Noto Nastaliq Urdu';">${urduTitle}</h3>
                <div class="bilingual">
                    <p class="english-text">${englishBody}</p>
                    <p class="urdu-text">${urduBody}</p>
                </div>
                <div class="modal-buttons">
                    ${showCancel ? '<button id="modalCancelBtn" class="btn-secondary">Cancel</button>' : ''}
                    <button id="modalConfirmBtn" class="btn-primary">OK</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        setTimeout(() => overlay.classList.add('active'), 10);
        const confirmBtn = overlay.querySelector('#modalConfirmBtn');
        const cancelBtn = overlay.querySelector('#modalCancelBtn');
        confirmBtn.onclick = () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
            if (onConfirm) onConfirm();
        };
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 300);
            };
        }
    }

    // ========== 5. AUTO-INJECT BRANDING, FOOTER, WHATSAPP ==========
    function loadFontAwesome() {
        if (!document.querySelector('link[href*="fontawesome"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
            document.head.appendChild(link);
        }
    }

    function injectBranding() {
        if (document.querySelector('.peshox-brand')) return;
        const brand = document.createElement('div');
        brand.className = 'peshox-brand';
        brand.innerHTML = `<i class="fas fa-brain"></i> ${PX_CONFIG.brandName}`;
        document.body.appendChild(brand);
    }

    function injectFooter() {
        if (document.querySelector('.global-footer')) return;
        const footer = document.createElement('footer');
        footer.className = 'global-footer';
        footer.innerHTML = `
            <div class="bilingual">
                <span class="english-text"> System Status: Secure. Access granted to verified users only. Powered by PeshoX Neural Engines. Managed by ${PX_CONFIG.footerCredit}.</span>
                <span class="urdu-text"> سسٹم کی صورتحال: محفوظ۔ صرف تصدیق شدہ صارفین کو رسائی دی گئی ہے۔ PeshoX نیورل انجن کے ذریعے تقویت یافتہ۔ ${PX_CONFIG.footerCredit} کے زیر انتظام۔</span>
            </div>
        `;
        document.body.appendChild(footer);
    }

    function injectWhatsApp() {
        if (document.querySelector('.whatsapp-float')) return;
        const wa = document.createElement('div');
        wa.className = 'whatsapp-float';
        wa.innerHTML = '<i class="fab fa-whatsapp"></i>';
        wa.onclick = () => window.open(PX_CONFIG.whatsappChannel, '_blank');
        document.body.appendChild(wa);
    }

    document.addEventListener('DOMContentLoaded', () => {
        loadFontAwesome();
        injectBranding();
        injectFooter();
        injectWhatsApp();
    });

    // ========== 6. EXPOSE PUBLIC API ==========
    window.PX = {
        CONFIG: window.PX_CONFIG,
        getUsers, saveUser, getUser,
        getCurrentUserKey, setCurrentUser, logout, checkAuth,
        getWalletBalance, setWalletBalance, addToWallet,
        getSubscription, saveSubscription, isSubscriptionActive,
        generateKey99, generateKey33, generateKey44, generateKey55, isValidKey,
        showLoader, showModal,
        STORAGE_KEYS: STORAGE
    };
})();
