// Check if Chrome
const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
if (!isChrome) {
    document.body.innerHTML = '<div style="display:flex;height:100vh;justify-content:center;align-items:center;background:black;color:red;font-size:32px;text-align:center;"><div><h1>⛔ CHROME ONLY ⛔</h1><p>Please use Google Chrome browser</p></div></div>';
}

// GAME STATE
let health = 100;
let time = 0;
let day = 1;
let gameInterval;
let digestionInterval;
let popupInterval;
let startTime = null;
let captchaCode = '';
let userCaptchaCode = '';
let currentColorHex = '';

// MATH QUESTIONS
// const mathQuestions = [
//     { q: "2 + 2 = ?", a: "4" },
//     { q: "10 - 7 = ?", a: "3" },
//     { q: "5 × 6 = ?", a: "30" },
//     { q: "20 ÷ 4 = ?", a: "5" },
//     { q: "9 + 6 = ?", a: "15" },
//     { q: "100 - 37 = ?", a: "63" },
//     { q: "12 × 3 = ?", a: "36" },
//     { q: "50 ÷ 5 = ?", a: "10" },
//     { q: "What is 7²?", a: "49" },
//     { q: "√64 = ?", a: "8" },
//     { q: "15 + 28 = ?", a: "43" },
//     { q: "99 - 54 = ?", a: "45" },
//     { q: "8 × 7 = ?", a: "56" },
//     { q: "144 ÷ 12 = ?", a: "12" },
//     { q: "What is 3³?", a: "27" },
//     { q: "6 × 9 = ?", a: "54" },
//     { q: "45 + 55 = ?", a: "100" },
//     { q: "1000 - 777 = ?", a: "223" },
//     { q: "25 × 4 = ?", a: "100" },
//     { q: "81 ÷ 9 = ?", a: "9" },
//     { q: "What is 5! (factorial)?", a: "120" },
//     { q: "17 + 38 = ?", a: "55" },
//     { q: "200 - 89 = ?", a: "111" },
//     { q: "11 × 11 = ?", a: "121" },
//     { q: "72 ÷ 8 = ?", a: "9" },
//     { q: "What is 2⁶?", a: "64" },
//     { q: "33 + 47 = ?", a: "80" },
//     { q: "500 - 213 = ?", a: "287" },
//     { q: "15 × 5 = ?", a: "75" },
//     { q: "96 ÷ 6 = ?", a: "16" },
//     { q: "Enter the captcha code shown earlier:", a: captchaCode }
// ];

// RANDOM FACTS
const randomFacts = [
    "Did you know? Sass the snake has trust issues.",
    "FUN FACT: You could be job hunting right now!",
    "REMINDER: Your resume is still incomplete.",
    "Did you know? 87% of traders fail in their first year.",
    "FUN FACT: This game has no prize.",
    "REMINDER: Your student loans are due.",
    "Did you know? Sass judges your pasting speed.",
    "FUN FACT: Your parents are disappointed.",
    "REMINDER: LinkedIn has 67 new job postings.",
    "Did you know? Real traders don't play games.",
    "FUN FACT: You've been staring at chickens for way too long.",
    "REMINDER: Time is money. You're losing both.",
    "Did you know? Sass is fake. So is this job.",
    "FUN FACT: Your friends are being productive right now.",
    "REMINDER: You fell for the 'easy money' bait."
];

function startGame() {
    // Screen check
    if (window.innerWidth < 1024) {
        alert("ACCESS DENIED: PLEASE USE A LAPTOP");
        return;
    }

    // Start timer
    if (!startTime) {
        startTime = Date.now();
    }

    // Fullscreen
    try { 
        document.documentElement.requestFullscreen(); 
    } catch(e) {}

    // Switch views
    document.getElementById('view-bait').style.display = 'none';
    document.getElementById('view-game').style.display = 'block';

    // Reset game state
    document.getElementById('snake-editor').value = "";
    health = 100;
    time = 0;
    day = 1;
    updateHealthBar();
    document.getElementById('day-display').innerText = day;

    // Start loops
    gameInterval = setInterval(gameLoop, 100);
    digestionInterval = setInterval(digest, 800);
    popupInterval = setInterval(showRandomPopup, 10000);

    // Show first math question immediately
    setTimeout(() => showMathQuestion(), 2000);
}

function gameLoop() {
    time += 0.1;
    document.getElementById('timer-display').innerText = Math.floor(time);

    const editor = document.getElementById('snake-editor');
    const text = editor.value;
    const chickenCount = (text.match(/🐥/g) || []).length;

    // Game rules
    if (chickenCount === 0) {
        health -= 2.0;
        updateStatus("⚠️ STARVING! PASTE FASTER!", "red");
    } else if (chickenCount > 10) {
        health -= 4.0;
        updateStatus("⚠️⚠️⚠️ OVEREATING! DELETE CHICKENS!", "orange");
    } else {
        if (health < 100) health += 0.2;
        updateStatus("DIGESTING...", "green");
    }

    updateHealthBar();

    // Shake screen if low health
    if (health < 30) {
        document.getElementById('view-game').classList.add('shake');
    } else {
        document.getElementById('view-game').classList.remove('shake');
    }

    // Death check
    if (health <= 0) {
        triggerGameOver(chickenCount === 0 ? "STARVATION" : "STOMACH RUPTURE");
        document.getElementById('random-popup').style.display = 'none';
        document.getElementById('math-modal').style.display = 'none';
    }
}

function digest() {
    const editor = document.getElementById('snake-editor');
    if (editor.value.includes('🐥')) {
        editor.value = editor.value.replace('🐥', '');
        editor.style.backgroundColor = "#ccffcc";
        setTimeout(() => editor.style.backgroundColor = "white", 100);
    }
}

function showMathQuestion() {
    // Special cases
    // if (day === 15) {
    //     showColordle();
    //     return;
    // }
// we changed from 20 to 5 for testing
    // if (day === 5) {
    //     showCaptchaPopup();
    //     setTimeout(() => showMathQuestion(), 5000);
    //     return;
    // }

    const modal = document.getElementById('math-modal');
    const questionDiv = document.getElementById('math-question');
    // const question = mathQuestions[day - 1];

    document.getElementById('modal-day').innerText = day;
    // questionDiv.innerText = question.q;
    // document.getElementById('math-answer').value = '';
    // modal.style.display = 'block';

        // Generate two random numbers between 1 and 100
    const num1 = Math.floor(Math.random() * 100) + 1; 
    const num2 = Math.floor(Math.random() * 100) + 1;
    
    // Randomly choose an operation: addition or subtraction
    const operations = ['+', '-'];
    const operation = operations[Math.floor(Math.random() * operations.length)];

    let question;
    let answer;

    // Create the question and calculate the answer based on the operation
    switch (operation) {
        case '+':
            question = `What is ${num1} + ${num2}?`;
            answer = (num1 + num2).toString();
            break;
        case '-':
            question = `What is ${num1} - ${num2}?`;
            answer = (num1 - num2).toString();
            break;
        default:
            break;
    }

    questionDiv.innerText = question; // Display the question
    document.getElementById('math-answer').value = ''; // Clear the input field
    modal.style.display = 'block'; // Show the modal

    // Store the correct answer for later verification
    window.correctAnswer = answer; 
}

function checkMath() {
    const answer = document.getElementById('math-answer').value.trim();
    // const correctAnswer = mathQuestions[day - 1].a;
    const correctAnswer = window.correctAnswer;

    if (answer === correctAnswer) {
        // Correct!
        document.getElementById('math-modal').style.display = 'none';
        day++;
        document.getElementById('day-display').innerText = day;

        if (day > 32) {
            // GAME WON!
            showFinalScreen();
        } else {
            // Next question
            setTimeout(() => showMathQuestion(), 8000);
        }
    } else {
        // Wrong answer = game over
        document.getElementById('math-modal').style.display = 'none';
        triggerGameOver("FAILED. Wow you suck at math.");
    }
}
// eh this not the right colordle man HELPPP
function showColordle() {
    document.getElementById('math-modal').style.display = 'none';
    
    // Generate random color
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    currentColorHex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();

    document.getElementById('color-display').style.backgroundColor = currentColorHex;
    document.getElementById('color-input').value = '';
    document.getElementById('colordle-container').style.display = 'block';
}

function checkColordle() {
    const answer = document.getElementById('color-input').value.trim().toUpperCase();
    
    if (answer === currentColorHex) {
        document.getElementById('colordle-container').style.display = 'none';
        day++;
        document.getElementById('day-display').innerText = day;
        setTimeout(() => showMathQuestion(), 8000);
    } else {
        triggerGameOver("FAILED COLOR CHALLENGE");
    }
}

function showCaptchaPopup() {
    // Generate random 5-char code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    captchaCode = '';
    for (let i = 0; i < 5; i++) {
        captchaCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    mathQuestions[31].a = captchaCode; // Update final question
    document.getElementById('captcha-code').innerText = captchaCode;
    document.getElementById('captcha-popup').style.display = 'block';
}

function closeCaptcha() {
    document.getElementById('captcha-popup').style.display = 'none';
}

function showRandomPopup() {
    const popup = document.createElement('div');
    popup.className = 'random-popup';
    popup.innerHTML = `
        <span class="popup-close" onclick="this.parentElement.remove()">×</span>
        ${randomFacts[Math.floor(Math.random() * randomFacts.length)]}
    `;
    
    // Random position
    popup.style.top = Math.random() * (window.innerHeight - 200) + 'px';
    popup.style.left = Math.random() * (window.innerWidth - 400) + 'px';
    
    document.body.appendChild(popup);

    // Make draggable
    let isDragging = false;
    let offsetX, offsetY;

    popup.onmousedown = (e) => {
        if (e.target.className === 'popup-close') return;
        isDragging = true;
        offsetX = e.clientX - popup.offsetLeft;
        offsetY = e.clientY - popup.offsetTop;
    };

    document.onmousemove = (e) => {
        if (isDragging) {
            popup.style.left = (e.clientX - offsetX) + 'px';
            popup.style.top = (e.clientY - offsetY) + 'px';
        }
    };

    document.onmouseup = () => {
        isDragging = false;
    };

    // Auto-remove after 8 seconds
    // setTimeout(() => popup.remove(), 8000);
}

function copyChicken() {
    navigator.clipboard.writeText("🐥");
    const btn = event.target;
    btn.innerText = "✅ COPIED!";
    setTimeout(() => btn.innerText = "📋 COPY CHICKEN (🐥)", 500);
}

function updateStatus(msg, color) {
    const el = document.getElementById('status-msg');
    el.innerText = msg;
    el.style.color = color;
}

function updateHealthBar() {
    const bar = document.getElementById('health-bar');
    const text = document.getElementById('health-text');
    
    health = Math.max(0, Math.min(100, health));
    bar.style.width = health + '%';
    text.innerText = Math.floor(health) + '%';

    // Color coding
    bar.className = 'health-bar';
    if (health < 30) {
        bar.classList.add('low');
    } else if (health < 60) {
        bar.classList.add('medium');
    }
}

function triggerGameOver(reason) {
    clearInterval(gameInterval);
    clearInterval(digestionInterval);
    clearInterval(popupInterval);

    cleanupUIEffects();
    
    document.getElementById('death-reason').innerText = "CAUSE OF TERMINATION: " + reason;
    document.getElementById('view-game').style.display = 'none';
    document.getElementById('view-gameover').style.display = 'flex';
    document.getElementById('captcha-popup').style.display = 'none';
    document.getElementById('math-modal').style.display = 'none';
    document.getElementById('colordle-container').style.display = 'none';
    
    try { document.exitFullscreen(); } catch(e) {}
}

function showFinalScreen() {
    clearInterval(gameInterval);
    clearInterval(digestionInterval);
    clearInterval(popupInterval);

    cleanupUIEffects();
    
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('final-time').innerText = totalTime;
    
    document.getElementById('view-game').style.display = 'none';
    document.getElementById('view-final').style.display = 'flex';
    
    try { document.exitFullscreen(); } catch(e) {}
}

function restartGame() {
    // Don't reset startTime!
    document.getElementById('view-gameover').style.display = 'none';
    startGame();
}

function cleanupUIEffects() {
    // Stop screen shake
    document.body.classList.remove('shake');

    // Remove all random popups
    document.querySelectorAll('.random-popup').forEach(popup => popup.remove());

    // Remove global drag handlers
    document.onmousemove = null;
    document.onmouseup = null;
}
