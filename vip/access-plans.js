/**
 * access-plans.js – VIP Gateway (Full file)
 * - Plan selection → redirect to payment.html?plan=...
 * - Key activation: validates 33/44/55 chars, saves subscription, redirects to /engine/dashboard.html
 * - Review feed: 50+ fake reviews; likes (once per user); free users cannot comment
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Authentication guard ---
    const userKey = PX.getCurrentUserKey();
    if (!userKey) {
        window.location.href = '/';
        return;
    }
    const isVip = PX.isSubscriptionActive();

    // --- DOM elements ---
    const selectPlanBtns = document.querySelectorAll('.select-plan-btn');
    const activateBtn = document.getElementById('activateKeyBtn');
    const accessKeyInput = document.getElementById('accessKeyInput');
    const reviewsFeed = document.getElementById('reviewsFeed');

    // --- Plan selection: redirect to payment.html with plan param ---
    selectPlanBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const plan = btn.getAttribute('data-plan');
            PX.showLoader(1000, () => {
                window.location.href = `/vip/payment.html?plan=${plan}`;
            });
        });
    });

    // --- Key activation logic (33/44/55) ---
    function activateKey() {
        const key = accessKeyInput.value.trim();
        if (!key) {
            PX.showModal(
                'Input Required',
                'درج کرنا ضروری ہے',
                'Please enter your Access Key.',
                'براہ کرم اپنی رسائی کلید درج کریں۔',
                null, false
            );
            return;
        }
        let plan = null;
        let durationHours = 0;
        let isValid = false;
        if (key.length === 33 && PX.isValidKey(key, 33)) {
            plan = 'basic';
            durationHours = 1;
            isValid = true;
        } else if (key.length === 44 && PX.isValidKey(key, 44)) {
            plan = 'standard';
            durationHours = 24;
            isValid = true;
        } else if (key.length === 55 && PX.isValidKey(key, 55)) {
            plan = 'premium';
            durationHours = 72;
            isValid = true;
        }
        if (!isValid) {
            PX.showModal(
                'Invalid Key',
                'غلط کلید',
                'Key must be 33, 44, or 55 characters and contain letters, numbers, symbols, and a space.',
                'کلید 33، 44، یا 55 حروف کی ہونی چاہیے اور اس میں حروف، اعداد، علامات اور خالی جگہ ہونی چاہیے۔',
                null, false
            );
            return;
        }
        const expiry = Date.now() + (durationHours * 60 * 60 * 1000);
        PX.saveSubscription(expiry, plan);
        PX.showModal(
            'Activation Successful',
            'ایکٹیویشن کامیاب',
            `You now have ${plan.toUpperCase()} access for ${durationHours} hours. Redirecting to dashboard...`,
            `اب آپ کو ${plan.toUpperCase()} ایکسیس ${durationHours} گھنٹے کے لیے مل گئی ہے۔ ڈیش بورڈ پر ری ڈائریکٹ ہو رہا ہے...`,
            () => {
                window.location.href = '/engine/dashboard.html';
            },
            false
        );
    }
    activateBtn.addEventListener('click', activateKey);
    accessKeyInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') activateKey(); });

    // --- Fake reviews generation (50+) ---
    const firstNames = ["Aarav","Zain","Sofia","Olivia","Muhammad","Rahul","Fatima","Emily","David","Priya","Ahmed","Liam","Noor","Hassan","Aisha","John","Emma","Ali","Sara","Vikram","Kabir","Mei","Chen","Raj","Simran","James","Maria","Carlos","Anita","Abdullah","Zara","Omar","Layla","Michael","Sarah","Chris","Jessica","Bilal","Nadia","Ravi","Tariq","Shan","Gurpreet","Faisal","Kamila","Yusuf","Iqbal","Leila","Daniyal"];
    const lastNames = ["Khan","Sharma","Singh","Patel","Ahmed","Ali","Chen","Kumar","Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores","Green"];
    const reviewTexts = [
        "Amazing accuracy! Recovered my losses quickly.",
        "Best detector I've ever used. Premium is worth it.",
        "Works like magic. Signals are always on point.",
        "Easy to use, but sometimes the activation takes a moment.",
        "I've tripled my bankroll in 2 days. Incredible tool.",
        "The radar sweep is so realistic. Love it.",
        "Customer support via WhatsApp is super responsive.",
        "Standard plan gave me consistent 10x signals.",
        "Finally a predictor that actually works. Thank you!",
        "The cooldown timer makes me feel in control.",
        "The Urdu translations make it feel local and trusted.",
        "Premium plan paid for itself in 3 hours. Insane.",
        "The 44-char key activation was instant. Great system.",
        "Best investment for Aviator players. Highly recommend."
    ];
    function randomName() { return firstNames[Math.floor(Math.random()*firstNames.length)] + ' ' + lastNames[Math.floor(Math.random()*lastNames.length)]; }
    function randomBadge() { const r = Math.random(); if(r<0.5) return 'premium'; if(r<0.8) return 'standard'; return 'basic'; }
    function randomStars() { const r = Math.random(); if(r<0.7) return 5; if(r<0.9) return 4; return 3; }
    function randomLikes() { return Math.floor(Math.random() * 1200) + 50; }

    let fakeReviews = [];
    for (let i = 0; i < 50; i++) {
        fakeReviews.push({
            id: i,
            name: randomName(),
            badge: randomBadge(),
            stars: randomStars(),
            text: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
            likes: randomLikes(),
            timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
        });
    }
    fakeReviews.sort((a,b) => b.likes - a.likes);

    let likedReviews = JSON.parse(localStorage.getItem('_px_liked_reviews') || '[]');

    function renderReviews() {
        reviewsFeed.innerHTML = '';
        fakeReviews.slice(0, 45).forEach(review => {
            const starsFull = '★'.repeat(review.stars) + '☆'.repeat(5-review.stars);
            const isLiked = likedReviews.includes(review.id);
            const likeIcon = isLiked ? '❤️' : '🤍';
            const div = document.createElement('div');
            div.className = 'review-card';
            div.innerHTML = `
                <div class="review-header">
                    <span class="reviewer-name">${review.name}</span>
                    <span class="review-badge ${review.badge}">${review.badge.toUpperCase()}</span>
                </div>
                <div class="review-stars">${starsFull}</div>
                <div class="review-text">${review.text}</div>
                <div class="review-footer">
                    <span>📅 ${review.timestamp}</span>
                    <div>
                        <button class="like-btn" data-id="${review.id}">${likeIcon} ${review.likes} Likes</button>
                        <button class="comment-btn" data-id="${review.id}"><i class="fas fa-comment"></i> Comment</button>
                    </div>
                </div>
            `;
            const likeBtn = div.querySelector('.like-btn');
            const commentBtn = div.querySelector('.comment-btn');
            likeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (likedReviews.includes(review.id)) {
                    PX.showModal(
                        'Already Liked',
                        'پہلے ہی لائک کیا',
                        'You have already liked this review.',
                        'آپ پہلے ہی اس ریویو کو لائک کر چکے ہیں۔',
                        null, false
                    );
                    return;
                }
                review.likes += 1;
                likedReviews.push(review.id);
                localStorage.setItem('_px_liked_reviews', JSON.stringify(likedReviews));
                renderReviews();
                PX.showModal(
                    'Like Added',
                    'لائک شامل',
                    'Your like has been counted.',
                    'آپ کا لائک شمار کر لیا گیا۔',
                    null, false
                );
            });
            commentBtn.addEventListener('click', () => {
                if (!isVip) {
                    PX.showModal(
                        'VIP Only',
                        'صرف وی آئی پی',
                        'Only VIP members can leave reviews. Upgrade to join the conversation.',
                        'صرف وی آئی پی ممبران ہی ریویو دے سکتے ہیں۔ گفتگو میں شامل ہونے کے لیے اپگریڈ کریں۔',
                        null, false
                    );
                } else {
                    PX.showModal(
                        'Comment Feature',
                        'تبصرہ کی خصوصیت',
                        'This is a simulation. Comments are disabled in demo mode.',
                        'یہ ایک سمولیشن ہے۔ ڈیمو موڈ میں تبصرے غیر فعال ہیں۔',
                        null, false
                    );
                }
            });
            reviewsFeed.appendChild(div);
        });
    }
    renderReviews();
});
