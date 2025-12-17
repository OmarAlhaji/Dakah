// --- Game Data ---
// QUESTIONS_DB loaded from questions.js

const EVENTS_DB = [
    { type: 'STEAL', title: 'جاك الموت! 🦹', desc: 'اسرق 200 نقطة من الخصم.. ولا يهمك أحد!', effect: (game) => game.applySteal() },
    { type: 'DOUBLE', title: 'تدبيل يا مدير! 🚀', desc: 'السؤال الجاي دبل نقاط.. ركز يا وحش!', effect: (game) => game.applyDouble() },
    { type: 'GIFT', title: 'أبشر بالعوض 🎁', desc: 'جاك 100 نقطة هدية.. تستاهل!', effect: (game) => game.applyGift() },
    { type: 'SWAP', title: 'اقلب الطاولة 🔄', desc: 'الدور راح للفريق الثاني.. خيرها بغيرها!', effect: (game) => game.applySwap() },
];

class Game {
    constructor() {
        this.teams = [
            { id: 1, name: "Team 1", score: 0, elScore: null, elName: null },
            { id: 2, name: "Team 2", score: 0, elScore: null, elName: null }
        ];
        this.config = { totalRounds: 10 };
        this.state = {
            currentRound: 1,
            currentTeamIndex: 0,
            currentQuestion: null,
            isDoublePoints: false,
            usedQuestions: new Set()
        };
        this.currentUser = localStorage.getItem('saudiGameUser') || null;
        this.settings = JSON.parse(localStorage.getItem('saudiGameSettings')) || { sfx: true };

        this.sfx = {
            correct: document.getElementById('sfx-correct'),
            wrong: document.getElementById('sfx-wrong'),
            win: document.getElementById('sfx-win')
        };
    }

    init() {
        // UI Bindings
        const range = document.getElementById('rounds-input');
        const rangeVal = document.getElementById('rounds-value');
        if (range && rangeVal) range.addEventListener('input', (e) => rangeVal.innerText = e.target.value);

        // Populate Categories
        const grid = document.getElementById('categories-container');
        if (grid) {
            grid.innerHTML = '';
            Object.keys(QUESTIONS_DB).forEach(cat => {
                const btn = document.createElement('button');
                btn.className = 'cat-btn';
                btn.innerText = cat;
                btn.onclick = () => this.selectCategory(cat);
                grid.appendChild(btn);
            });
        }

        // Login Check
        if (this.currentUser) {
            this.showHome();
        } else {
            this.switchScreen('login');
        }

        // Apply Settings
        document.getElementById('toggle-sfx').checked = this.settings.sfx;
    }

    // --- User System ---
    login() {
        const username = document.getElementById('username-input').value.trim();
        if (!username) return alert('يا الحبيب، اكتب اسمك أول!');
        this.currentUser = username;
        localStorage.setItem('saudiGameUser', username);
        this.showHome();
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('saudiGameUser');
        location.reload();
    }

    showHome() {
        document.getElementById('welcome-msg').innerText = `هلا والله، ${this.currentUser}!`;
        document.getElementById('main-nav').classList.remove('hidden');
        this.switchScreen('home');
    }

    // --- Navigation ---
    switchScreen(screenName) {
        document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
        document.getElementById(`screen-${screenName}`).classList.add('active');

        // Hide Nav on Login/Game/End, Show on Home/Leaderboard/Settings
        const nav = document.getElementById('main-nav');
        if (screenName === 'home' || screenName === 'leaderboard' || screenName === 'settings') {
            if (this.currentUser) nav.classList.remove('hidden');
        } else {
            nav.classList.add('hidden');
        }
    }

    switchView(viewName) {
        document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
        document.getElementById(`view-${viewName}`).classList.add('active');
    }

    goHome() {
        this.switchScreen('home');
    }

    // --- Settings & Leaderboard ---
    showLeaderboard() {
        const list = document.getElementById('leaderboard-list');
        const scores = JSON.parse(localStorage.getItem('saudiGameScores')) || [];

        // Header
        let html = '<div class="lb-item header"><span>#</span><span>الفريق</span><span>نقاط</span></div>';

        if (scores.length === 0) {
            html += '<div style="text-align:center; padding:20px;">ما فيه أحد فاز للحين! 🌚</div>';
        } else {
            scores.sort((a, b) => b.score - a.score).slice(0, 10).forEach((s, i) => {
                let badge = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
                html += `<div class="lb-item"><span>${badge}</span><span>${s.team} (${s.user})</span><span>${s.score}</span></div>`;
            });
        }
        list.innerHTML = html;
        this.switchScreen('leaderboard');
    }

    showSettings() {
        this.switchScreen('settings');
    }

    toggleSfx() {
        this.settings.sfx = document.getElementById('toggle-sfx').checked;
        localStorage.setItem('saudiGameSettings', JSON.stringify(this.settings));
    }

    // --- JSON File System ---
    exportData() {
        const data = {
            user: this.currentUser,
            settings: this.settings,
            scores: JSON.parse(localStorage.getItem('saudiGameScores')) || []
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "saudi_game_data.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    }

    importData(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                // Validate and Import
                if (data.user) {
                    this.currentUser = data.user;
                    localStorage.setItem('saudiGameUser', data.user);
                }
                if (data.settings) {
                    this.settings = data.settings;
                    localStorage.setItem('saudiGameSettings', JSON.stringify(data.settings));
                }
                if (data.scores) {
                    localStorage.setItem('saudiGameScores', JSON.stringify(data.scores));
                }

                alert('تم استرجاع البيانات بنجاح! 🎉');
                location.reload(); // Refresh to apply changes
            } catch (err) {
                alert('الملف خربان أو مو صحيح! ❌');
                console.error(err);
            }
        };
        reader.readAsText(file);
    }

    clearData() {
        if (confirm('متأكد تبي تمسح كل شي؟ (بنسوي تسجيل خروج)')) {
            localStorage.clear();
            location.reload();
        }
    }

    // --- Gameplay ---
    start() {
        this.teams[0].name = document.getElementById('team1-input').value || "الصقور";
        this.teams[1].name = document.getElementById('team2-input').value || "الذئاب";
        this.config.totalRounds = parseInt(document.getElementById('rounds-input').value);

        this.teams[0].elName = document.getElementById('name-display-1');
        this.teams[0].elScore = document.getElementById('score-display-1');
        this.teams[1].elName = document.getElementById('name-display-2');
        this.teams[1].elScore = document.getElementById('score-display-2');

        this.score1 = 0; this.score2 = 0; // Internal reset
        this.teams[0].score = 0; this.teams[1].score = 0;

        this.updateScoreboard();
        document.getElementById('total-rounds').innerText = this.config.totalRounds;

        this.switchScreen('game');
        this.state.currentRound = 1;
        this.state.currentTeamIndex = 0;
        this.startTurn();
    }

    startTurn() {
        const team = this.teams[this.state.currentTeamIndex];
        this.state.isDoublePoints = false;

        document.getElementById('current-round').innerText = this.state.currentRound;

        // Update Text Indicator
        const turnText = document.getElementById('current-team-turn');
        if (turnText) {
            turnText.innerText = team.name;
            // Force Colors via JS
            if (this.state.currentTeamIndex === 0) {
                turnText.style.color = '#FFD700'; // Gold
                turnText.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.5)';
            } else {
                turnText.style.color = '#00E676'; // Green
                turnText.style.textShadow = '0 0 10px rgba(0, 230, 118, 0.5)';
            }
        }

        // Force Active Class & Inline Styles for Score Boxes
        const box1 = document.getElementById('score-box-1');
        const box2 = document.getElementById('score-box-2');

        // Reset
        box1.classList.remove('active');
        box1.style.transform = 'scale(1)';
        box1.style.borderColor = 'transparent';

        box2.classList.remove('active');
        box2.style.transform = 'scale(1)';
        box2.style.borderColor = 'transparent';

        // Set Active
        const activeBox = this.state.currentTeamIndex === 0 ? box1 : box2;
        activeBox.classList.add('active');
        activeBox.style.transform = 'scale(1.2)';
        activeBox.style.borderColor = this.state.currentTeamIndex === 0 ? '#FFD700' : '#00E676'; // Visual border to be sure

        // Overlay Logic
        const overlay = document.getElementById('turn-overlay');
        const overlayName = document.getElementById('overlay-team-name');
        if (overlay && overlayName) {
            overlayName.innerText = team.name;
            overlayName.style.color = this.state.currentTeamIndex === 0 ? '#FFD700' : '#00E676';
            overlay.classList.remove('hidden');
            setTimeout(() => {
                overlay.classList.add('hidden');
                this.switchView('categories');
            }, 1500);
        } else {
            this.switchView('categories');
        }
    }

    selectCategory(cat) {
        if (Math.random() < 0.15) { this.triggerEvent(); return; }
        this.loadQuestion(cat);
    }

    triggerEvent() {
        const event = EVENTS_DB[Math.floor(Math.random() * EVENTS_DB.length)];
        this.currentEvent = event;
        document.getElementById('event-title').innerText = event.title;
        document.getElementById('event-desc').innerText = event.desc;
        this.switchView('event');
    }

    resolveEvent() {
        if (this.currentEvent && this.currentEvent.effect) this.currentEvent.effect(this);
    }

    applySteal() {
        const current = this.state.currentTeamIndex;
        const other = current === 0 ? 1 : 0;
        let amount = 200;
        if (this.teams[other].score < 200) amount = this.teams[other].score;
        this.teams[other].score -= amount;
        this.teams[current].score += amount;
        this.updateScoreboard();
        this.endTurn();
    }

    applyDouble() {
        this.state.isDoublePoints = true;
        this.switchView('categories');
    }

    applyGift() {
        this.teams[this.state.currentTeamIndex].score += 100;
        this.updateScoreboard();
        this.endTurn();
    }

    applySwap() {
        this.state.currentTeamIndex = this.state.currentTeamIndex === 0 ? 1 : 0;
        this.updateScoreboard();
        alert(`تم قلب الطاولة! الدور صار لفريق ${this.teams[this.state.currentTeamIndex].name}`);
        this.switchView('categories');
    }

    loadQuestion(category) {
        let allQuestions = QUESTIONS_DB[category];
        if (!allQuestions) allQuestions = QUESTIONS_DB[Object.keys(QUESTIONS_DB)[0]]; // Fallback

        const available = allQuestions.filter(q => !this.state.usedQuestions.has(category + ":" + q.q));
        if (available.length === 0) {
            alert("خلصت أسئلة هذا القسم!");
            return;
        }
        const qData = available[Math.floor(Math.random() * available.length)];
        this.state.currentQuestion = qData;
        this.state.usedQuestions.add(category + ":" + qData.q);

        document.getElementById('q-category').innerText = category;
        document.getElementById('q-text').innerText = qData.q;
        document.getElementById('a-text').innerText = qData.a;

        document.getElementById('question-card').classList.remove('flipped');
        document.getElementById('answer-controls').classList.add('hidden');

        this.switchView('question');
        this.startTimer();
    }

    startTimer() {
        this.stopTimer();
        let timeLeft = 30;
        const timerEl = document.getElementById('timer-display');
        const timerCircle = document.querySelector('.timer-circle');

        if (timerEl) timerEl.innerText = timeLeft;
        if (timerCircle) timerCircle.classList.remove('warning');

        this.timerInterval = setInterval(() => {
            timeLeft--;
            if (timerEl) timerEl.innerText = timeLeft;
            if (timeLeft <= 10 && timerCircle) timerCircle.classList.add('warning');
            if (timeLeft <= 0) {
                this.stopTimer();
                this.playSound('wrong');
                this.flipCard();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    flipCard() {
        this.stopTimer();
        const card = document.getElementById('question-card');
        if (!card.classList.contains('flipped')) {
            card.classList.add('flipped');

            // Update buttons with current names
            document.getElementById('btn-win-team1').innerText = this.teams[0].name;
            document.getElementById('btn-win-team2').innerText = this.teams[1].name;

            document.getElementById('answer-controls').classList.remove('hidden');
        }
    }

    handleWin(winnerIndex) {
        if (winnerIndex !== -1) {
            let points = 100;
            if (this.state.isDoublePoints) points *= 2;

            // Award to strict winner
            this.teams[winnerIndex].score += points;
            this.playSound('correct');
        } else {
            this.playSound('wrong');
        }
        this.updateScoreboard();
        this.endTurn();
    }

    endTurn() {
        if (this.state.currentRound >= this.config.totalRounds && this.state.currentTeamIndex === 1) {
            this.endGame();
            return;
        }
        if (this.state.currentTeamIndex === 1) {
            this.state.currentRound++;
            this.state.currentTeamIndex = 0;
        } else {
            this.state.currentTeamIndex = 1;
        }
        this.startTurn();
    }

    endGame() {
        // Save Score
        const winner = this.teams[0].score >= this.teams[1].score ? this.teams[0] : this.teams[1];
        const scores = JSON.parse(localStorage.getItem('saudiGameScores')) || [];
        scores.push({
            user: this.currentUser,
            team: winner.name,
            score: winner.score,
            date: new Date().toISOString()
        });
        localStorage.setItem('saudiGameScores', JSON.stringify(scores));

        this.switchScreen('end');
        document.getElementById('end-team1').innerText = this.teams[0].name;
        document.getElementById('end-score1').innerText = this.teams[0].score;
        document.getElementById('end-team2').innerText = this.teams[1].name;
        document.getElementById('end-score2').innerText = this.teams[1].score;

        let winnerText = this.teams[0].score > this.teams[1].score ? this.teams[0].name : (this.teams[1].score > this.teams[0].score ? this.teams[1].name : "تعادل");
        document.getElementById('winner-name').innerText = winnerText;
        this.playSound('win');
    }

    updateScoreboard() {
        this.teams[0].elName.innerText = this.teams[0].name;
        this.teams[0].elScore.innerText = this.teams[0].score;
        this.teams[1].elName.innerText = this.teams[1].name;
        this.teams[1].elScore.innerText = this.teams[1].score;
    }

    playSound(type) {
        if (!this.settings.sfx) return;
        if (this.sfx[type]) {
            this.sfx[type].currentTime = 0;
            this.sfx[type].play().catch(e => { });
        }
    }
}

const game = new Game();
window.onload = () => game.init();
