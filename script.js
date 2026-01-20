// --- Game Data ---
// QUESTIONS_DB loaded from questions.js

// Removed Random Events DB

class Game {
    constructor() {
        this.teams = [
            {
                id: 1,
                name: "Team 1",
                score: 0,
                elScore: null,
                elName: null,
                categories: [], // Selected Categories
                helpMethods: { steal: true, double: true, gift: true, change: true } // Availability
            },
            {
                id: 2,
                name: "Team 2",
                score: 0,
                elScore: null,
                elName: null,
                categories: [],
                helpMethods: { steal: true, double: true, gift: true, change: true }
            }
        ];
        this.config = { totalRounds: 10 };
        this.state = {
            currentRound: 1,
            currentTeamIndex: 0,
            currentQuestion: null,
            currentCategory: null, // Track for 'Change Question'
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

    // --- Settings, Leaderboard, Export (Unchanged Logic basically) ---
    showLeaderboard() {
        const list = document.getElementById('leaderboard-list');
        const scores = JSON.parse(localStorage.getItem('saudiGameScores')) || [];

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
        document.body.appendChild(downloadAnchorNode);
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
                location.reload();
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

    // --- Setup Phase ---
    start() {
        // 1. Get Team Names & Rounds
        this.teams[0].name = document.getElementById('team1-input').value || "الصقور";
        this.teams[1].name = document.getElementById('team2-input').value || "الذئاب";
        this.config.totalRounds = parseInt(document.getElementById('rounds-input').value);

        // 2. Prepare UI Elements
        this.teams[0].elName = document.getElementById('name-display-1');
        this.teams[0].elScore = document.getElementById('score-display-1');
        this.teams[1].elName = document.getElementById('name-display-2');
        this.teams[1].elScore = document.getElementById('score-display-2');

        // Reset Scores
        this.teams[0].score = 0; this.teams[1].score = 0;
        this.updateScoreboard();

        // 3. Go to Category Selection
        this.setupCategorySelection();
    }

    setupCategorySelection() {
        const cats = Object.keys(QUESTIONS_DB);
        const container1 = document.getElementById('cat-options-team1');
        const container2 = document.getElementById('cat-options-team2');

        document.getElementById('cat-team1-name').innerText = this.teams[0].name;
        document.getElementById('cat-team2-name').innerText = this.teams[1].name;

        // Render Checkboxes
        const renderOpts = (container, teamIdx) => {
            container.innerHTML = '';
            cats.forEach(cat => {
                const label = document.createElement('label');
                label.className = 'cat-option-label';
                label.innerHTML = `
                    <input type="checkbox" class="cat-option-input" value="${cat}" data-team="${teamIdx}">
                    <span class="cat-option-btn">${cat}</span>
                `;
                container.appendChild(label);
            });
        };

        renderOpts(container1, 0);
        renderOpts(container2, 1);

        this.switchScreen('category-select');
    }

    submitCategories() {
        const team1Opts = Array.from(document.querySelectorAll('input[data-team="0"]:checked')).map(el => el.value);
        const team2Opts = Array.from(document.querySelectorAll('input[data-team="1"]:checked')).map(el => el.value);

        if (team1Opts.length < 2 || team2Opts.length < 2) {
            alert('كل فريق لازم يختار على الأقل قسمين! ⚠️');
            return;
        }

        this.teams[0].categories = team1Opts;
        this.teams[1].categories = team2Opts;

        // Start Gameplay
        document.getElementById('total-rounds').innerText = this.config.totalRounds;
        this.switchScreen('game');
        this.state.currentRound = 1;
        this.state.currentTeamIndex = 0;
        this.startTurn();
    }

    // --- Gameplay ---
    startTurn() {
        const team = this.teams[this.state.currentTeamIndex];
        this.state.isDoublePoints = false;
        this.state.currentQuestion = null;

        document.getElementById('current-round').innerText = this.state.currentRound;

        // Render Categories for THIS TEAM
        const grid = document.getElementById('categories-container');
        grid.innerHTML = '';
        team.categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'cat-btn';
            btn.innerText = cat;
            btn.onclick = () => this.selectCategory(cat);
            grid.appendChild(btn);
        });

        // Update Text Indicator
        const turnText = document.getElementById('current-team-turn');
        if (turnText) {
            turnText.innerText = team.name;
            turnText.style.color = this.state.currentTeamIndex === 0 ? '#FFD700' : '#00E676';
        }

        // Active State UI
        const box1 = document.getElementById('score-box-1');
        const box2 = document.getElementById('score-box-2');
        box1.classList.remove('active'); box2.classList.remove('active');

        const activeBox = this.state.currentTeamIndex === 0 ? box1 : box2;
        activeBox.classList.add('active');

        this.updateHelpButtons();

        // Overlay
        const overlay = document.getElementById('turn-overlay');
        const overlayName = document.getElementById('overlay-team-name');
        if (overlay && overlayName) {
            overlayName.innerText = team.name;
            overlayName.style.color = this.state.currentTeamIndex === 0 ? '#FFD700' : '#00E676';
            overlay.classList.remove('hidden');
            setTimeout(() => {
                overlay.classList.add('hidden');
                this.switchView('categories');
            }, 1000);
        } else {
            this.switchView('categories');
        }
    }

    selectCategory(cat) {
        this.state.currentCategory = cat;
        this.loadQuestion(cat);
    }

    loadQuestion(category) {
        let allQuestions = QUESTIONS_DB[category];
        if (!allQuestions) return;

        // Filter used
        const available = allQuestions.filter(q => !this.state.usedQuestions.has(category + ":" + q.q));

        if (available.length === 0) {
            alert("خلصت أسئلة هذا القسم لفريقكم! اختاروا غيره.");
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
        this.runSequentialTimer();
    }

    // --- Help Methods ---
    useHelp(teamIndex, type) {
        if (teamIndex !== this.state.currentTeamIndex) {
            alert('هذا مو دورك يا غالي!');
            return;
        }

        const team = this.teams[teamIndex];
        if (!team.helpMethods[type]) {
            alert('استخدمتوا هذي الوسيلة من قبل!');
            return;
        }

        switch (type) {
            case 'steal':
                this.applySteal(teamIndex);
                break;
            case 'double':
                this.applyDouble(teamIndex);
                break;
            case 'gift':
                this.applyGift(teamIndex);
                break;
            case 'change':
                // Can only be used if viewing a question
                if (!document.getElementById('view-question').classList.contains('active')) {
                    alert('لازم تختار سؤال أول عشان تغيره!');
                    return;
                }
                this.applyChange(teamIndex);
                break;
        }

        // Mark as used
        team.helpMethods[type] = false;
        this.updateHelpButtons();
    }

    applySteal(teamIndex) {
        const otherIndex = teamIndex === 0 ? 1 : 0;
        const otherTeam = this.teams[otherIndex];
        const myTeam = this.teams[teamIndex];

        let amount = 200;
        if (otherTeam.score < 200) amount = otherTeam.score; // Take whatever they have
        if (amount <= 0) {
            alert('الخصم مفلس! ما يمديك تسرق شي 😂');
            return; // Don't use up the ability if failed? No, let's use it up to be strategic.
            // Actually, if amount is 0, maybe don't use it? Let's burn it.
        }

        otherTeam.score -= amount;
        myTeam.score += amount;
        this.updateScoreboard();
        alert(`تمت السرقة بنجاح! 🦹\nسرقت ${amount} نقطة من ${otherTeam.name}`);
        this.playSound('correct'); // reuse sound
    }

    applyDouble(teamIndex) {
        this.state.isDoublePoints = true;
        alert('تم تفعيل الدبل لهذي الجولة! 🚀\nأي نقاط بتجيبها بتصير دبل');
    }

    applyGift(teamIndex) {
        this.teams[teamIndex].score += 100;
        this.updateScoreboard();
        alert('مبروك! جاك 100 نقطة هدية 🎁');
        this.playSound('correct');
    }

    applyChange(teamIndex) {
        // Find another question from SAME category
        // Remove current question from used set (so it can appear again later? No, keep it used)
        // Actually, "Change Question" usually burns the current question.

        // Load new question logic
        this.stopTimer();
        alert('جاري تغيير القير... 🔄');
        this.loadQuestion(this.state.currentCategory);
        // Note: loadQuestion will add the new one to used set. The old one remains in used set.
    }

    updateHelpButtons() {
        [0, 1].forEach(tIdx => {
            const team = this.teams[tIdx];
            const div = document.getElementById(`help-methods-${tIdx + 1}`);
            if (!div) return;

            // For each help type, try to find its button by matching the onclick handler
            ['steal', 'double', 'gift', 'change'].forEach(type => {
                const selector = `button[onclick*="useHelp(${tIdx}, '${type}')"]`;
                const btn = div.querySelector(selector);
                if (!btn) return; // button may be absent (commented out or intentionally removed)
                btn.disabled = !Boolean(team.helpMethods[type]);
            });

            // Visual check for current turn: toggle class on all available buttons
            const allBtns = Array.from(div.querySelectorAll('button'));
            if (tIdx !== this.state.currentTeamIndex) {
                allBtns.forEach(b => b.classList.add('not-my-turn'));
            } else {
                allBtns.forEach(b => b.classList.remove('not-my-turn'));
            }
        });
    }

    // --- Timer & Logic ---
    runSequentialTimer() {
        this.stopTimer();
        this.timerPhase = 1; // 1: Current Team, 2: Other Team
        this.startTeamTimer(this.state.currentTeamIndex);
    }

    startTeamTimer(teamIndex) {
        let timeLeft = 30;
        const timerEl = document.getElementById(`timer-team-${teamIndex + 1}`);

        // Show Timer UI
        document.querySelectorAll('.team-timer').forEach(el => el.classList.add('hidden'));
        if (timerEl) {
            timerEl.classList.remove('hidden');
            timerEl.innerText = timeLeft;
            timerEl.classList.remove('warning');
        }

        this.timerInterval = setInterval(() => {
            timeLeft--;
            if (timerEl) timerEl.innerText = timeLeft;

            if (timeLeft <= 10 && timerEl) timerEl.classList.add('warning');

            if (timeLeft <= 0) {
                clearInterval(this.timerInterval);
                if (this.timerPhase === 1) {
                    // Phase 1 Over -> Start Phase 2 (Other Team)
                    this.timerPhase = 2;
                    const otherIndex = teamIndex === 0 ? 1 : 0;
                    this.playSound('wrong'); // Sound for timeout
                    this.startTeamTimer(otherIndex); // Start other team
                } else {
                    // Phase 2 Over -> Show Answer
                    this.stopTimer();
                    this.playSound('wrong');
                    this.flipCard();
                }
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        document.querySelectorAll('.team-timer').forEach(el => el.classList.add('hidden'));
    }

    flipCard() {
        this.stopTimer();
        const card = document.getElementById('question-card');
        if (!card.classList.contains('flipped')) {
            card.classList.add('flipped');
            document.getElementById('btn-win-team1').innerText = this.teams[0].name;
            document.getElementById('btn-win-team2').innerText = this.teams[1].name;
            document.getElementById('answer-controls').classList.remove('hidden');
        }
    }

    handleWin(winnerIndex) {
        if (winnerIndex !== -1) {
            let points = 100;
            if (this.state.isDoublePoints) points *= 2;
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
