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
        // This forces the browser to download and cache them NOW
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
    "HE IS COMING."
];

const wordleWords = [
    "CHICK",
    // "HACKS",
    // "CODES",
    // "BRAIN",
    // "CRANE",
    // "APPLE",
    // "GRAPE",
    // "PLANE",
    // "SNAKE",
    // "TRICK"
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
    // Start loops
    gameInterval = setInterval(gameLoop, 100);
    digestionInterval = setInterval(digest, 800);
    popupInterval = setInterval(showRandomPopup, 2000); //shortened from 10s to 7s

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
        }
    } else if (chickenCount > 10) {
        health -= 4.0;
        updateStatus("⚠️⚠️⚠️ OVEREATING! DELETE CHICKENS!", "orange");
        if (!snakeImg.src.includes('snake_full.png')) {
            snakeImg.src = "/static/snake_full.png";
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
    
    if (day === 3) {
        showWordle();
        return;
    }

    if (day === 4 && captchaCode === '') {
        showCaptchaPopup();
    }

    if (day === 7) {
        document.getElementById('modal-day').innerText = day;
        document.getElementById('math-question').innerText = "Enter the captcha code that appeared";
        document.getElementById('math-answer').value = '';
        document.getElementById('math-modal').style.display = 'block';

        window.correctAnswer = captchaCode;
        return;
    }

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

        if (day > 7) {
            // GAME WON!
            showFinalScreen();
        } else {
            // Next question
            setTimeout(() => showMathQuestion(), 8000);
        }
    } else {
        // Wrong answer = game over
        document.getElementById('math-modal').style.display = 'none';
        if (day === 7) {
            triggerGameOver("Hmm... did a captcha code appear somewhere in day 5?")
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

    // Mark letters
    guess.forEach((letter, i) => {
        const cell = row.children[i];
        cell.innerText = letter;

        if (letter === target[i]) {
            cell.classList.add('correct'); // green
        } else if (target.includes(letter)) {
            cell.classList.add('present'); // yellow
        } else {
            cell.classList.add('absent'); // gray
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
    // 1. Generate the Code
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz';
    captchaCode = '';
    for (let i = 0; i < 5; i++) {
        captchaCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // 2. Create the Element
    const popup = document.createElement('div');
    popup.className = 'random-popup'; // Re-use the yellow styling
    popup.style.zIndex = '2500'; // Make sure it sits on top of other popups
    popup.innerHTML = `
        <span class="popup-close" onclick="this.parentElement.remove()">×</span>
        FUN FACT: The code is ${captchaCode}
    `;

    // 3. Random Position
    popup.style.top = Math.random() * (window.innerHeight - 200) + 'px';
    popup.style.left = Math.random() * (window.innerWidth - 400) + 'px';

    document.body.appendChild(popup);

    // 4. ADD DRAG LOGIC (The "Sticky-Proof" Version)
    popup.onmousedown = (e) => {
        if (e.target.className === 'popup-close') return;

        let shiftX = e.clientX - popup.getBoundingClientRect().left;
        let shiftY = e.clientY - popup.getBoundingClientRect().top;

        popup.style.zIndex = 3000; // Bring to absolute front while dragging

        function moveAt(pageX, pageY) {
            popup.style.left = pageX - shiftX + 'px';
            popup.style.top = pageY - shiftY + 'px';
        }

        function onMouseMove(event) {
            moveAt(event.pageX, event.pageY);
        }

        // Listen on DOCUMENT so fast movements don't break it
        document.addEventListener('mousemove', onMouseMove);

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            popup.style.zIndex = 2000; // Return to normal high Z-index
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
    // 1. Pick the text
    const text = randomFacts[Math.floor(Math.random() * randomFacts.length)];
    
    // 2. Identify if this is a "Cursed" fact
    const isCursed = (text === "HE IS COMING.");

    // 3. Create the Popup
    const popup = document.createElement('div');
    popup.className = 'random-popup';
    
    // Note: We removed the onclick="this.parentElement.remove()" from HTML
    popup.innerHTML = `
        <span class="popup-close">×</span>
        ${text}
    `;
    
    // 4. THE TRAP: Attach the specific close behavior
    const closeBtn = popup.querySelector('.popup-close');
    closeBtn.onclick = function() {
        popup.remove(); // Remove the popup first
        
        if (isCursed) {
            // WAIT! If it was the cursed text, trigger the scare NOW.
            showJumpScare();
        }
    };
    
    // 5. Positioning
    popup.style.top = Math.random() * (window.innerHeight - 200) + 'px';
    popup.style.left = Math.random() * (window.innerWidth - 400) + 'px';
    
    document.body.appendChild(popup);

    // --- FIX: INDEPENDENT DRAG LOGIC ---
    popup.onmousedown = (e) => {
        // Prevent dragging if clicking the "X" button
        if (e.target.className === 'popup-close') return;

        // Calculate offset from the corner of the popup
        let shiftX = e.clientX - popup.getBoundingClientRect().left;
        let shiftY = e.clientY - popup.getBoundingClientRect().top;

        // Bring the clicked popup to the front
        popup.style.zIndex = 2500; 

        // 1. Define moving function for THIS specific popup
        function moveAt(pageX, pageY) {
            popup.style.left = pageX - shiftX + 'px';
            popup.style.top = pageY - shiftY + 'px';
        }

        // 2. Move it once immediately (fix jumpiness)
        moveAt(e.pageX, e.pageY);

        // 3. Define the mousemove handler
        function onMouseMove(event) {
            moveAt(event.pageX, event.pageY);
        }

        // 4. Attach event listeners to document (so you can drag fast)
        document.addEventListener('mousemove', onMouseMove);

        // 5. Cleanup on mouse up
        popup.onmouseup = function() {
            document.removeEventListener('mousemove', onMouseMove);
            popup.onmouseup = null;
            popup.style.zIndex = 500; // Reset Z-index (optional)
        };
    };

    // Disable browser's native drag-and-drop support for the image/text
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

    // Color coding
    bar.className = 'health-bar';
    if (health < 30) {
        bar.classList.add('low');
    } else if (health < 60) {
        bar.classList.add('medium');
    }
}

function showJumpScare() {
    const scare = document.createElement('img');
    scare.src = "/static/scare.jpg"; 
    
    scare.style.position = 'fixed';
    scare.style.top = '50%';
    scare.style.left = '50%';
    scare.style.width = '100vw'; 
    scare.style.height = '100vh';
    scare.style.objectFit = 'contain'; 
    scare.style.zIndex = '99999';
    
    // Hide it initially so we don't see a broken icon
    scare.style.opacity = '0';

    document.body.appendChild(scare);

    // ONLY START ANIMATION WHEN LOADED
    scare.onload = function() {
        scare.style.opacity = '1'; // Make visible
        scare.style.animation = "flyAtScreen 0.25s ease-in forwards"; 

        // Start the removal timer NOW, not earlier
        setTimeout(() => {
            scare.remove();
        }, 250);
    };

    // If it's already cached (fast load), trigger immediately
    if (scare.complete) {
        scare.onload();
    }
}

function triggerGameOver(reason) {
    // 1. STOP EVERYTHING
    clearInterval(gameInterval);
    clearInterval(digestionInterval);
    clearInterval(popupInterval);
    
    // Stop the pending math question if it's waiting to pop up
    if (typeof mathTimeout !== 'undefined' && mathTimeout) {
        clearTimeout(mathTimeout);
    }

    // 2. FORCE HIDE ALL MODALS (The "Nuclear Option")
    // We use a helper here so if one ID is wrong, the others still close.
    safeHide('math-modal');          // <--- This is the one from your screenshot
    safeHide('intro-modal');
    safeHide('wordle-modal');
    safeHide('captcha-popup');
    safeHide('colordle-container');
    safeHide('final-captcha-modal');

    // 3. Remove any drag-and-drop elements
    cleanupUIEffects();
    
    // 4. Show the Death Screen
    const deathReasonEl = document.getElementById('death-reason');
    if (deathReasonEl) deathReasonEl.innerText = "CAUSE OF TERMINATION: " + reason;

    safeHide('view-game');
    
    const viewGameOver = document.getElementById('view-gameover');
    if (viewGameOver) viewGameOver.style.display = 'flex';

    // 5. Exit Fullscreen
    try { document.exitFullscreen(); } catch(e) {}
}

function safeHide(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = 'none';
        el.classList.remove('show'); // Just in case you use classes later
    }
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
    cleanupUIEffects();
    startGame();
}

function cleanupUIEffects() {

    document.getElementById('view-game').classList.remove('shake'); 
    document.body.classList.remove('shake'); // (Optional fallback)

    // Remove all random popups
    document.querySelectorAll('.random-popup').forEach(popup => popup.remove());

    // Remove global drag handlers
    document.onmousemove = null;
    document.onmouseup = null;
}
