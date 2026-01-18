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
let wordleWord = '';
let wordleAttempts = 0;
const MAX_WORDLE_ATTEMPTS = 6;
let captchaCode = '';
let userCaptchaCode = '';
window.correctAnswer = null;
let mathTimeout = null; 

// Audio Tracker for Snake Sounds ---
let snakeSFX = null; 
// ------------------------------------------

// --- PRELOAD IMAGES ---
const imagesToPreload = [
    "/static/scare.jpg",
    "/static/snake_normal.png",
    "/static/snake_hungry.png",
    "/static/snake_full.png"
];

function preloadImages() {
    imagesToPreload.forEach((src) => {
        const img = new Image();
        img.src = src;
    });
}
// Call it immediately
preloadImages();

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
    "REMINDER: You fell for the 'easy money' bait.",
    "FUN FACT: I am on 5 hours of sleep for the past 2 days.",
    "HE IS COMING.",
    "HE IS COMING."
];

const wordleWords = [
    "CHICK",
    "HACKS",
    "CODES",
    "BRAIN",
    "CRANE",
    "APPLE",
    "GRAPE",
    "PLANE",
    "SNAKE",
    "TRICK",
    "SUMAC"
];

function startGame() {
    // Screen check
    cleanupUIEffects();
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

    const introAudio = document.getElementById('audio-intro');
    introAudio.volume = 0.5; 
    introAudio.play().catch(e => console.log("Audio error:", e));

    // Switch views
    document.getElementById('view-bait').style.display = 'none';
    document.getElementById('view-game').style.display = 'block';

    // Reset game state
    document.getElementById('snake-editor').value = "";
    health = 100;
    day = 1;
    captchaCode = '';
    updateHealthBar();
    updateStatus("STATUS: HUNGRY", "black")
    document.getElementById('day-display').innerText = day;

    document.getElementById('intro-modal').style.display = 'block';
}
function beginShift() {
    cleanupUIEffects();
    document.getElementById('intro-modal').style.display = 'none';
    
    // --- SOUND: SWAP MUSIC ---
    const introAudio = document.getElementById('audio-intro');
    const bgAudio = document.getElementById('audio-bg');
    
    introAudio.pause();          // Stop Intro
    introAudio.currentTime = 0;  // Rewind Intro
    
    bgAudio.volume = 1.0;        // Set Volume
    bgAudio.play();              // Start Game Music

    // Start loops
    gameInterval = setInterval(gameLoop, 100);
    // Removed duplicate gameInterval call here
    digestionInterval = setInterval(digest, 800);
    popupInterval = setInterval(showRandomPopup, 2000); 

    // Show first math question immediately
    setTimeout(() => showMathQuestion(), 500);
}

function gameLoop() {
    time += 0.1;
    document.getElementById('timer-display').innerText = Math.floor(time);

    const editor = document.getElementById('snake-editor');
    const text = editor.value;
    const chickenCount = (text.match(/🐥/g) || []).length;

    // Select the image
    const snakeImg = document.getElementById('snake-avatar');
    
    // Game rules
    if (chickenCount === 0) {
        health -= 2.0;
        updateStatus("⚠️ STARVING! PASTE FASTER!", "red");
        
        if (!snakeImg.src.includes('snake_hungry.png')) {
            snakeImg.src = "/static/snake_hungry.png";
            
            // --- UPDATED: Track the audio ---
            if (snakeSFX) { snakeSFX.pause(); snakeSFX.currentTime = 0; }
            snakeSFX = new Audio('/static/starve.mp4');
            snakeSFX.play();
            // --------------------------------
        }
    } else if (chickenCount > 10) {
        health -= 4.0;
        updateStatus("⚠️⚠️⚠️ OVEREATING! DELETE CHICKENS!", "orange");
        
        if (!snakeImg.src.includes('snake_full.png')) {
            snakeImg.src = "/static/snake_full.png";
            
            // --- UPDATED: Track the audio ---
            if (snakeSFX) { snakeSFX.pause(); snakeSFX.currentTime = 0; }
            snakeSFX = new Audio('/static/full.mp4');
            snakeSFX.play();
            // --------------------------------
        }
    } else {
        if (health < 100) health += 0.2;
        updateStatus("DIGESTING...", "green");
        if (!snakeImg.src.includes('snake_normal.png')) {
            snakeImg.src = "/static/snake_normal.png";
        }
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
    if (document.getElementById('view-gameover').style.display === 'flex') return;
    
    if (day === 6) {
        showWordle();
        return;
    }

    if (day === 13 && captchaCode === '') {
        showCaptchaPopup();
    }

    if (day === 20) {
        document.getElementById('modal-day').innerText = day;
        document.getElementById('math-question').innerText = "Enter the captcha code that appeared";
        document.getElementById('math-answer').value = '';
        document.getElementById('math-modal').style.display = 'block';

        window.correctAnswer = captchaCode;
        return;
    }

    const modal = document.getElementById('math-modal');
    const questionDiv = document.getElementById('math-question');

    document.getElementById('modal-day').innerText = day;

    const num1 = Math.floor(Math.random() * 100) + 1; 
    const num2 = Math.floor(Math.random() * 100) + 1;
    
    const operations = ['+', '-'];
    const operation = operations[Math.floor(Math.random() * operations.length)];

    let question;
    let answer;

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

    questionDiv.innerText = question; 
    document.getElementById('math-answer').value = ''; 
    modal.style.display = 'block'; 

    window.correctAnswer = answer; 
}

function checkMath() {
    const answer = document.getElementById('math-answer').value.trim();
    const correctAnswer = window.correctAnswer;

    if (answer === correctAnswer) {
        document.getElementById('math-modal').style.display = 'none';
        day++;
        document.getElementById('day-display').innerText = day;

        if (day > 20) {
            showFinalScreen();
        } else {
            setTimeout(() => showMathQuestion(), 8000);
        }
    } else {
        document.getElementById('math-modal').style.display = 'none';
        if (day === 20) {
            triggerGameOver("Hmm... did a captcha code appear somewhere earlier?")
        }
        else {
        triggerGameOver("FAILED. Wow you suck at math.");
        }
    }
}

function showWordle() {
    if (document.getElementById('view-gameover').style.display === 'flex') return;

    document.getElementById('math-modal').style.display = 'none';

    wordleWord = wordleWords[Math.floor(Math.random() * wordleWords.length)];
    wordleAttempts = 0;

    const grid = document.getElementById('wordle-grid');
    grid.innerHTML = '';

    for (let i = 0; i < MAX_WORDLE_ATTEMPTS; i++) {
        const row = document.createElement('div');
        row.className = 'wordle-row';

        for (let j = 0; j < 5; j++) {
            const cell = document.createElement('div');
            cell.className = 'wordle-cell';
            row.appendChild(cell);
        }

        grid.appendChild(row);
    }

    document.getElementById('wordle-input').value = '';
    document.getElementById('wordle-modal').style.display = 'block';
}

function submitWordle() {
    const input = document
        .getElementById('wordle-input')
        .value
        .toUpperCase();

    if (input.length !== 5) return;

    const row = document.querySelectorAll('.wordle-row')[wordleAttempts];
    const target = wordleWord.split('');
    const guess = input.split('');

    guess.forEach((letter, i) => {
        const cell = row.children[i];
        cell.innerText = letter;

        if (letter === target[i]) {
            cell.classList.add('correct'); 
        } else if (target.includes(letter)) {
            cell.classList.add('present'); 
        } else {
            cell.classList.add('absent'); 
        }
    });

    wordleAttempts++;
    document.getElementById('wordle-input').value = '';

    if (input === wordleWord) {
        document.getElementById('wordle-modal').style.display = 'none';
        day++;
        document.getElementById('day-display').innerText = day;
        setTimeout(() => showMathQuestion(), 1000);
        return;
    }

    if (wordleAttempts >= MAX_WORDLE_ATTEMPTS) {
        triggerGameOver("FAILED WORDLE SECURITY CHECK");
    }
}

function showCaptchaPopup() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz';
    captchaCode = '';
    for (let i = 0; i < 5; i++) {
        captchaCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const popup = document.createElement('div');
    popup.className = 'random-popup'; 
    popup.style.zIndex = '2500'; 
    popup.innerHTML = `
        <span class="popup-close" onclick="this.parentElement.remove()">×</span>
        FUN FACT: The code is ${captchaCode}
    `;

    popup.style.top = Math.random() * (window.innerHeight - 200) + 'px';
    popup.style.left = Math.random() * (window.innerWidth - 400) + 'px';

    document.body.appendChild(popup);

    popup.onmousedown = (e) => {
        if (e.target.className === 'popup-close') return;

        let shiftX = e.clientX - popup.getBoundingClientRect().left;
        let shiftY = e.clientY - popup.getBoundingClientRect().top;

        popup.style.zIndex = 3000; 

        function moveAt(pageX, pageY) {
            popup.style.left = pageX - shiftX + 'px';
            popup.style.top = pageY - shiftY + 'px';
        }

        function onMouseMove(event) {
            moveAt(event.pageX, event.pageY);
        }

        document.addEventListener('mousemove', onMouseMove);

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            popup.style.zIndex = 2000; 
        }

        document.addEventListener('mouseup', onMouseUp);
    };

    popup.ondragstart = function() {
        return false;
    };
}

function closeCaptcha() {
    document.getElementById('captcha-popup').style.display = 'none';
}

function showFinalCaptchaChallenge() {
    document.getElementById('math-modal').style.display = 'none';

    document.getElementById('final-captcha-input').value = '';
    document.getElementById('final-captcha-modal').style.display = 'block';
}

function checkFinalCaptcha() {
    const input = document
        .getElementById('final-captcha-input')
        .value
        .trim()
        .toUpperCase();

    if (input === captchaCode) {
        document.getElementById('final-captcha-modal').style.display = 'none';
        showFinalScreen();
    } else {
        triggerGameOver("FAILED. Your memory needs improvement.");
    }
}

function showRandomPopup() {
    const text = randomFacts[Math.floor(Math.random() * randomFacts.length)];
    const isCursed = (text === "HE IS COMING.");

    const popup = document.createElement('div');
    popup.className = 'random-popup';
    
    popup.innerHTML = `
        <span class="popup-close">×</span>
        ${text}
    `;
    
    const closeBtn = popup.querySelector('.popup-close');
    closeBtn.onclick = function() {
        popup.remove(); 
        if (isCursed) {
            showJumpScare();
        }
    };
    
    popup.style.top = Math.random() * (window.innerHeight - 200) + 'px';
    popup.style.left = Math.random() * (window.innerWidth - 400) + 'px';
    
    document.body.appendChild(popup);

    popup.onmousedown = (e) => {
        // Prevent dragging if clicking the "X" button
        if (e.target.className === 'popup-close') return;

        // Calculate offset
        let shiftX = e.clientX - popup.getBoundingClientRect().left;
        let shiftY = e.clientY - popup.getBoundingClientRect().top;

        // Bring to front
        popup.style.zIndex = 2500; 

        function moveAt(pageX, pageY) {
            popup.style.left = pageX - shiftX + 'px';
            popup.style.top = pageY - shiftY + 'px';
        }

        // Move once immediately
        moveAt(e.pageX, e.pageY);

        function onMouseMove(event) {
            moveAt(event.pageX, event.pageY);
        }

        // Listen for moves on the WHOLE DOCUMENT
        document.addEventListener('mousemove', onMouseMove);

        // --- THE FIX IS HERE ---
        // We define a separate function for mouse up
        function onMouseUp() {
            // Stop tracking movement
            document.removeEventListener('mousemove', onMouseMove);
            // Stop tracking the release (clean up this listener)
            document.removeEventListener('mouseup', onMouseUp);
            
            popup.style.zIndex = 500; // Reset Z-index
        }

        // Listen for release on the WHOLE DOCUMENT (not just the popup)
        document.addEventListener('mouseup', onMouseUp);
    };

    popup.ondragstart = function() {
        return false;
    };
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

    bar.className = 'health-bar';
    if (health < 30) {
        bar.classList.add('low');
    } else if (health < 60) {
        bar.classList.add('medium');
    }
}

function showJumpScare() {
    const scream = new Audio('/static/guest-1337-scream.mp3');
    scream.volume = 1.0;

    const scare = document.createElement('img');
    scare.src = "/static/scare.jpg"; 
    
    scare.style.position = 'fixed';
    scare.style.top = '50%';
    scare.style.left = '50%';
    scare.style.width = '100vw'; 
    scare.style.height = '100vh';
    scare.style.objectFit = 'contain'; 
    scare.style.zIndex = '99999';
    scare.style.opacity = '0'; 

    document.body.appendChild(scare);

    scare.onload = function() {
        scare.style.opacity = '1';
        scream.play().catch(e => console.log("Audio play failed:", e));
        scare.style.animation = "flyAtScreen 0.25s ease-in forwards"; 

        setTimeout(() => {
            scare.remove(); 
            scream.pause(); 
            scream.currentTime = 0; 
        }, 500);
    };

    if (scare.complete) {
        scare.onload();
    }
}

function triggerGameOver(reason) {
    // Safety Locks
    if (document.getElementById('view-gameover').style.display === 'flex') return;
    if (document.getElementById('view-final').style.display === 'flex') return;

    // 1. STOP EVERYTHING
    clearInterval(gameInterval);
    clearInterval(digestionInterval);
    clearInterval(popupInterval);
    
    if (typeof mathTimeout !== 'undefined' && mathTimeout) {
        clearTimeout(mathTimeout);
    }

    // --- STOP ALL OTHER SOUNDS ---
    const bgMusic = document.getElementById('audio-bg');
    if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
    }
    
    // --- UPDATED: Stop Snake SFX ---
    if (snakeSFX) {
        snakeSFX.pause();
        snakeSFX.currentTime = 0;
    }
    // -------------------------------

    const failSoundFile = Math.random() > 0.5 ? '/static/meow-meow-meow-tiktok.mp3' : '/static/i-got-this-fahhhhhh.mp3';
    const failAudio = new Audio(failSoundFile);
    failAudio.volume = 0.8;
    failAudio.play();

    safeHide('math-modal');
    safeHide('intro-modal');
    safeHide('wordle-modal');
    safeHide('captcha-popup');
    safeHide('final-captcha-modal');

    cleanupUIEffects();
    
    const deathReasonEl = document.getElementById('death-reason');
    if (deathReasonEl) deathReasonEl.innerText = "CAUSE OF TERMINATION: " + reason;

    safeHide('view-game');
    
    const viewGameOver = document.getElementById('view-gameover');
    if (viewGameOver) viewGameOver.style.display = 'flex';

    try { document.exitFullscreen(); } catch(e) {}
}

function safeHide(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = 'none';
        el.classList.remove('show'); 
    }
}

function showFinalScreen() {
    clearInterval(gameInterval);
    clearInterval(digestionInterval);
    clearInterval(popupInterval);
    cleanupUIEffects();

    // --- SOUND: VICTORY ---
    document.getElementById('audio-bg').pause(); 
    
    // --- UPDATED: Stop Snake SFX ---
    if (snakeSFX) {
        snakeSFX.pause();
        snakeSFX.currentTime = 0;
    }
    // -------------------------------
    
    const winAudio = new Audio('/static/john-cena-meme-original.mp3');
    winAudio.volume = 1.0;
    winAudio.play();

    cleanupUIEffects();
    
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('final-time').innerText = totalTime;
    
    document.getElementById('view-game').style.display = 'none';
    document.getElementById('view-final').style.display = 'flex';
    
    try { document.exitFullscreen(); } catch(e) {}
}

function restartGame() {
    const bgAudio = document.getElementById('audio-bg');
    const introAudio = document.getElementById('audio-intro');

    if (bgAudio) {
        bgAudio.pause();
        bgAudio.currentTime = 0;
    }
    if (introAudio) {
        introAudio.pause();
        introAudio.currentTime = 0;
    }
    
    // Safety cleanup for Snake SFX
    if (snakeSFX) {
        snakeSFX.pause();
        snakeSFX.currentTime = 0;
    }

    document.getElementById('view-gameover').style.display = 'none';
    cleanupUIEffects();
    location.reload();
}

function cleanupUIEffects() {

    document.getElementById('view-game').classList.remove('shake'); 
    document.body.classList.remove('shake'); 

    document.querySelectorAll('.random-popup').forEach(popup => popup.remove());

    document.onmousemove = null;
    document.onmouseup = null;
}
