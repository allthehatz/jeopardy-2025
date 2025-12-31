// ============================================
// GAME STATE
// ============================================
let teams = [];
let currentQuestion = null;
let currentValue = 0;
let answeredQuestions = new Set();
let dailyDoubles = new Set(); // Card IDs that are Daily Doubles
let isDailyDouble = false;
let ddSelectedTeam = null;
let ddWagerAmount = 0;
let countdownInterval = null;
let countdownTime = 10;

// Final Jeopardy state
let finalJeopardyData = null;
let fjWagers = {};
let fjTimer = null;
let fjTimeLeft = 30;

// ============================================
// DOM ELEMENTS
// ============================================
const setupModal = document.querySelector("#setupModal");
const teamCountSelect = document.querySelector("#teamCount");
const teamNamesDiv = document.querySelector("#teamNames");
const startGameBtn = document.querySelector("#startGameBtn");
const scoreboard = document.querySelector("#scoreboard");

const qDiv = document.querySelector("#qDiv");
const closeBtn = document.querySelector("#closeBtn");
const qText = document.querySelector("#qText");
const questionValue = document.querySelector("#questionValue");
const revealBtn = document.querySelector("#revealBtn");
const answerSection = document.querySelector("#answerSection");
const answerReveal = document.querySelector("#answerReveal");
const answerText = document.querySelector("#answerText");
const sourceLink = document.querySelector("#sourceLink");
const scoringSection = document.querySelector("#scoringSection");
const teamButtons = document.querySelector("#teamButtons");
const noPointsBtn = document.querySelector("#noPointsBtn");

// Daily Double elements
const ddRevealModal = document.querySelector("#ddRevealModal");
const ddTeamSelect = document.querySelector("#ddTeamSelect");
const ddWagerModal = document.querySelector("#ddWagerModal");
const ddWagerTeam = document.querySelector("#ddWagerTeam");
const ddCurrentScore = document.querySelector("#ddCurrentScore");
const ddMaxWager = document.querySelector("#ddMaxWager");
const ddWagerInput = document.querySelector("#ddWagerInput");
const ddConfirmWager = document.querySelector("#ddConfirmWager");
const ddBadge = document.querySelector("#ddBadge");
const ddScoringSection = document.querySelector("#ddScoringSection");
const ddTeamNameDisplay = document.querySelector("#ddTeamNameDisplay");
const ddWinAmount = document.querySelector("#ddWinAmount");
const ddLoseAmount = document.querySelector("#ddLoseAmount");
const ddCorrectBtn = document.querySelector("#ddCorrectBtn");
const ddWrongBtn = document.querySelector("#ddWrongBtn");

// Countdown timer elements
const countdownTimer = document.querySelector("#countdownTimer");
const timerText = document.querySelector("#timerText");
const timerProgress = document.querySelector("#timerProgress");

// Final Jeopardy elements
const fjCategoryModal = document.querySelector("#fjCategoryModal");
const fjCategoryName = document.querySelector("#fjCategoryName");
const fjStartWagers = document.querySelector("#fjStartWagers");
const fjWagerModal = document.querySelector("#fjWagerModal");
const fjTeamWagers = document.querySelector("#fjTeamWagers");
const fjLockWagers = document.querySelector("#fjLockWagers");
const fjQuestionModal = document.querySelector("#fjQuestionModal");
const fjTimerFill = document.querySelector("#fjTimerFill");
const fjTimerText = document.querySelector("#fjTimerText");
const fjCategoryBadge = document.querySelector("#fjCategoryBadge");
const fjQuestionText = document.querySelector("#fjQuestionText");
const fjRevealAnswer = document.querySelector("#fjRevealAnswer");
const fjAnswerModal = document.querySelector("#fjAnswerModal");
const fjAnswerText = document.querySelector("#fjAnswerText");
const fjSourceLink = document.querySelector("#fjSourceLink");
const fjTeamScoring = document.querySelector("#fjTeamScoring");
const fjShowResults = document.querySelector("#fjShowResults");
const fjResultsModal = document.querySelector("#fjResultsModal");
const fjWinnerName = document.querySelector("#fjWinnerName");
const fjWinnerScore = document.querySelector("#fjWinnerScore");
const fjFinalStandings = document.querySelector("#fjFinalStandings");
const fjPlayAgain = document.querySelector("#fjPlayAgain");

// ============================================
// TEAM SETUP
// ============================================
const teamColors = [
  "#e74c3c", // Red
  "#3498db", // Blue
  "#2ecc71", // Green
  "#f39c12", // Orange
  "#9b59b6", // Purple
  "#1abc9c"  // Teal
];

const defaultTeamNames = [
  "Team Champagne",
  "Team Countdown",
  "Team Confetti",
  "Team Fireworks",
  "Team Midnight",
  "Team Sparkle"
];

function generateTeamInputs() {
  const count = parseInt(teamCountSelect.value);
  teamNamesDiv.innerHTML = "";
  
  for (let i = 0; i < count; i++) {
    const wrapper = document.createElement("div");
    wrapper.className = "team-input-wrapper";
    wrapper.innerHTML = `
      <span class="team-color-dot" style="background-color: ${teamColors[i]}"></span>
      <input type="text" 
             class="team-name-input" 
             placeholder="${defaultTeamNames[i]}" 
             data-index="${i}"
             maxlength="20">
    `;
    teamNamesDiv.appendChild(wrapper);
  }
}

function initializeTeams() {
  const count = parseInt(teamCountSelect.value);
  teams = [];
  
  for (let i = 0; i < count; i++) {
    const input = document.querySelector(`input[data-index="${i}"]`);
    const name = input.value.trim() || defaultTeamNames[i];
    teams.push({
      name: name,
      score: 0,
      color: teamColors[i]
    });
  }
}

function renderScoreboard() {
  scoreboard.innerHTML = "";
  
  teams.forEach((team, index) => {
    const teamCard = document.createElement("div");
    teamCard.className = "team-score-card";
    teamCard.style.borderColor = team.color;
    teamCard.innerHTML = `
      <div class="team-name" style="background-color: ${team.color}">${team.name}</div>
      <div class="team-score" id="score-${index}">$${team.score.toLocaleString()}</div>
      <div class="score-adjust">
        <button class="adjust-btn minus" data-team="${index}" data-amount="-100">-100</button>
        <button class="adjust-btn plus" data-team="${index}" data-amount="100">+100</button>
      </div>
    `;
    scoreboard.appendChild(teamCard);
  });
  
  // Add event listeners for manual score adjustments
  document.querySelectorAll(".adjust-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const teamIndex = parseInt(e.target.dataset.team);
      const amount = parseInt(e.target.dataset.amount);
      adjustScore(teamIndex, amount);
    });
  });
}

function renderTeamButtons() {
  teamButtons.innerHTML = "";
  
  teams.forEach((team, index) => {
    const btn = document.createElement("button");
    btn.className = "team-award-btn";
    btn.style.backgroundColor = team.color;
    btn.textContent = team.name;
    btn.dataset.team = index;
    btn.addEventListener("click", () => awardPoints(index));
    teamButtons.appendChild(btn);
  });
}

function adjustScore(teamIndex, amount) {
  teams[teamIndex].score += amount;
  updateScoreDisplay(teamIndex);
}

function updateScoreDisplay(teamIndex) {
  const scoreEl = document.querySelector(`#score-${teamIndex}`);
  if (scoreEl) {
    scoreEl.textContent = `$${teams[teamIndex].score.toLocaleString()}`;
    scoreEl.classList.add("score-flash");
    setTimeout(() => scoreEl.classList.remove("score-flash"), 300);
  }
}

function awardPoints(teamIndex) {
  teams[teamIndex].score += currentValue;
  updateScoreDisplay(teamIndex);
  closeQuestion();
}

// ============================================
// COUNTDOWN TIMER
// ============================================
function startCountdown() {
  countdownTime = 10;
  updateTimerDisplay();
  countdownTimer.classList.add("active");
  
  // Reset the progress circle
  const circumference = 2 * Math.PI * 45;
  timerProgress.style.strokeDasharray = circumference;
  timerProgress.style.strokeDashoffset = 0;
  
  countdownInterval = setInterval(() => {
    countdownTime--;
    updateTimerDisplay();
    
    // Update progress circle
    const progress = (10 - countdownTime) / 10;
    timerProgress.style.strokeDashoffset = circumference * progress;
    
    if (countdownTime <= 0) {
      stopCountdown();
    }
  }, 1000);
}

function updateTimerDisplay() {
  timerText.textContent = countdownTime;
  
  // Add urgency styling when time is low
  if (countdownTime <= 3) {
    countdownTimer.classList.add("urgent");
  } else {
    countdownTimer.classList.remove("urgent");
  }
}

function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  countdownTimer.classList.remove("active", "urgent");
}

// ============================================
// DAILY DOUBLE LOGIC
// ============================================
function initializeDailyDoubles() {
  // Randomly select 2 questions to be Daily Doubles
  // Prefer higher value questions ($200-$400)
  const eligibleCards = [];
  for (let i = 0; i < 24; i++) {
    eligibleCards.push(`card-${i}`);
  }
  
  // Shuffle and pick 2
  const shuffled = eligibleCards.sort(() => Math.random() - 0.5);
  dailyDoubles.add(shuffled[0]);
  dailyDoubles.add(shuffled[1]);
  
  console.log("Daily Doubles assigned to:", Array.from(dailyDoubles));
}

function showDailyDoubleReveal() {
  // Show the exciting Daily Double reveal
  ddRevealModal.style.display = "flex";
  
  // Generate team selection buttons
  ddTeamSelect.innerHTML = "";
  teams.forEach((team, index) => {
    const btn = document.createElement("button");
    btn.className = "dd-team-btn";
    btn.style.backgroundColor = team.color;
    btn.textContent = team.name;
    btn.addEventListener("click", () => selectDDTeam(index));
    ddTeamSelect.appendChild(btn);
  });
}

function selectDDTeam(teamIndex) {
  ddSelectedTeam = teamIndex;
  ddRevealModal.style.display = "none";
  showWagerModal();
}

function showWagerModal() {
  const team = teams[ddSelectedTeam];
  const maxBoardValue = 400; // Highest value on the board
  const maxWager = Math.max(team.score, maxBoardValue);
  
  ddWagerTeam.textContent = team.name;
  ddWagerTeam.style.backgroundColor = team.color;
  ddCurrentScore.textContent = `$${team.score.toLocaleString()}`;
  ddMaxWager.textContent = `$${maxWager.toLocaleString()}`;
  
  // Set input constraints
  ddWagerInput.min = 5;
  ddWagerInput.max = maxWager;
  ddWagerInput.value = Math.min(100, maxWager);
  
  // Update quick wager buttons
  document.querySelectorAll(".dd-quick-btn").forEach(btn => {
    const amount = btn.dataset.amount;
    if (amount === "max") {
      btn.textContent = `ALL IN! ($${maxWager.toLocaleString()})`;
    }
  });
  
  ddWagerModal.style.display = "flex";
}

function confirmWager() {
  const team = teams[ddSelectedTeam];
  const maxBoardValue = 400;
  const maxWager = Math.max(team.score, maxBoardValue);
  
  let wager = parseInt(ddWagerInput.value) || 5;
  wager = Math.max(5, Math.min(wager, maxWager)); // Clamp between 5 and max
  
  ddWagerAmount = wager;
  ddWagerModal.style.display = "none";
  
  // Now show the actual question
  showDailyDoubleQuestion();
}

function showDailyDoubleQuestion() {
  const { question, answer, source, cardElement, cardId } = currentQuestion;
  
  // Show the question modal with DD styling
  qText.textContent = question;
  questionValue.textContent = `Wager: $${ddWagerAmount.toLocaleString()}`;
  answerText.textContent = answer;
  sourceLink.href = source;
  
  // Show DD badge
  ddBadge.style.display = "block";
  
  // Hide regular scoring, show DD scoring
  scoringSection.style.display = "none";
  ddScoringSection.style.display = "none";
  
  // Update DD scoring display
  ddTeamNameDisplay.textContent = teams[ddSelectedTeam].name;
  ddWinAmount.textContent = `$${ddWagerAmount.toLocaleString()}`;
  ddLoseAmount.textContent = `$${ddWagerAmount.toLocaleString()}`;
  
  // Hide answer section initially
  answerReveal.style.display = "none";
  revealBtn.style.display = "block";
  
  // Show modal and start countdown
  qDiv.style.display = "flex";
  startCountdown();
}

function revealDailyDoubleAnswer() {
  revealBtn.style.display = "none";
  answerReveal.style.display = "flex";
  ddScoringSection.style.display = "block";
}

function ddCorrect() {
  teams[ddSelectedTeam].score += ddWagerAmount;
  updateScoreDisplay(ddSelectedTeam);
  closeDailyDouble();
}

function ddWrong() {
  teams[ddSelectedTeam].score -= ddWagerAmount;
  updateScoreDisplay(ddSelectedTeam);
  closeDailyDouble();
}

function closeDailyDouble() {
  qDiv.style.display = "none";
  ddBadge.style.display = "none";
  ddScoringSection.style.display = "none";
  stopCountdown();
  
  // Reset modal state to prevent showing answer on next question
  answerReveal.style.display = "none";
  revealBtn.style.display = "block";
  scoringSection.style.display = "none";
  
  // Mark question as answered
  if (currentQuestion && currentQuestion.cardId) {
    answeredQuestions.add(currentQuestion.cardId);
    currentQuestion.cardElement.classList.add("answered");
    currentQuestion.cardElement.innerHTML = "<p>✓</p>";
  }
  
  // Reset DD state
  isDailyDouble = false;
  ddSelectedTeam = null;
  ddWagerAmount = 0;
  currentQuestion = null;
  currentValue = 0;
  
  checkGameComplete();
}

// ============================================
// QUESTION HANDLING
// ============================================
function showQuestion(question, answer, source, value, cardElement) {
  // Check if already answered
  const cardId = cardElement.dataset.cardId;
  if (answeredQuestions.has(cardId)) {
    return;
  }
  
  currentQuestion = { question, answer, source, cardElement, cardId };
  currentValue = value;
  
  // Check if this is a Daily Double
  if (dailyDoubles.has(cardId)) {
    isDailyDouble = true;
    showDailyDoubleReveal();
    return;
  }
  
  // Regular question flow
  isDailyDouble = false;
  ddBadge.style.display = "none";
  
  // Reset modal state
  qText.textContent = question;
  questionValue.textContent = `$${value}`;
  answerText.textContent = answer;
  sourceLink.href = source;
  
  // Hide answer section initially
  answerReveal.style.display = "none";
  revealBtn.style.display = "block";
  scoringSection.style.display = "none";
  ddScoringSection.style.display = "none";
  
  // Show modal and start countdown
  qDiv.style.display = "flex";
  startCountdown();
}

function revealAnswer() {
  revealBtn.style.display = "none";
  answerReveal.style.display = "flex";
  
  if (isDailyDouble) {
    ddScoringSection.style.display = "block";
  } else {
    scoringSection.style.display = "block";
  }
}

function closeQuestion() {
  if (isDailyDouble) {
    closeDailyDouble();
    return;
  }
  
  qDiv.style.display = "none";
  stopCountdown();
  
  // Reset modal state to prevent showing answer on next question
  answerReveal.style.display = "none";
  revealBtn.style.display = "block";
  scoringSection.style.display = "none";
  
  // Mark question as answered
  if (currentQuestion && currentQuestion.cardId) {
    answeredQuestions.add(currentQuestion.cardId);
    currentQuestion.cardElement.classList.add("answered");
    currentQuestion.cardElement.innerHTML = "<p>✓</p>";
  }
  
  currentQuestion = null;
  currentValue = 0;
  
  // Check if game is complete
  checkGameComplete();
}

function checkGameComplete() {
  const totalQuestions = 24; // 6 categories × 4 questions
  if (answeredQuestions.size === totalQuestions && finalJeopardyData) {
    // Start Final Jeopardy!
    setTimeout(() => {
      startFinalJeopardy();
    }, 500);
  }
}

// ============================================
// FINAL JEOPARDY
// ============================================
function startFinalJeopardy() {
  // Show the category reveal
  fjCategoryName.textContent = finalJeopardyData.category;
  fjCategoryModal.style.display = "flex";
}

function showFJWagerPhase() {
  fjCategoryModal.style.display = "none";
  
  // Generate wager inputs for each team
  fjTeamWagers.innerHTML = "";
  fjWagers = {};
  
  teams.forEach((team, index) => {
    const maxWager = Math.max(0, team.score);
    fjWagers[index] = 0;
    
    const wagerRow = document.createElement("div");
    wagerRow.className = "fj-wager-row";
    wagerRow.innerHTML = `
      <div class="fj-wager-team-info">
        <span class="fj-wager-dot" style="background-color: ${team.color}"></span>
        <span class="fj-wager-name">${team.name}</span>
        <span class="fj-wager-current">($${team.score.toLocaleString()})</span>
      </div>
      <div class="fj-wager-input-row">
        <span class="fj-wager-dollar">$</span>
        <input type="number" 
               class="fj-team-wager-input" 
               data-team="${index}"
               min="0" 
               max="${maxWager}"
               value="0"
               placeholder="0">
        <button class="fj-all-in-btn" data-team="${index}" data-max="${maxWager}">All In</button>
      </div>
    `;
    fjTeamWagers.appendChild(wagerRow);
  });
  
  // Add All In button handlers
  document.querySelectorAll(".fj-all-in-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const teamIdx = btn.dataset.team;
      const max = btn.dataset.max;
      const input = document.querySelector(`.fj-team-wager-input[data-team="${teamIdx}"]`);
      input.value = max;
    });
  });
  
  fjWagerModal.style.display = "flex";
}

function lockFJWagers() {
  // Collect all wagers
  document.querySelectorAll(".fj-team-wager-input").forEach(input => {
    const teamIdx = parseInt(input.dataset.team);
    const maxWager = Math.max(0, teams[teamIdx].score);
    let wager = parseInt(input.value) || 0;
    wager = Math.max(0, Math.min(wager, maxWager));
    fjWagers[teamIdx] = wager;
  });
  
  fjWagerModal.style.display = "none";
  showFJQuestion();
}

function showFJQuestion() {
  fjCategoryBadge.textContent = finalJeopardyData.category;
  fjQuestionText.textContent = finalJeopardyData.question;
  fjQuestionModal.style.display = "flex";
  
  // Start 30-second timer
  fjTimeLeft = 30;
  fjTimerText.textContent = fjTimeLeft;
  fjTimerFill.style.width = "100%";
  
  fjTimer = setInterval(() => {
    fjTimeLeft--;
    fjTimerText.textContent = fjTimeLeft;
    fjTimerFill.style.width = `${(fjTimeLeft / 30) * 100}%`;
    
    // Change color when low
    if (fjTimeLeft <= 10) {
      fjTimerFill.classList.add("urgent");
    }
    
    if (fjTimeLeft <= 0) {
      clearInterval(fjTimer);
      fjTimer = null;
    }
  }, 1000);
}

function showFJAnswer() {
  // Stop timer if still running
  if (fjTimer) {
    clearInterval(fjTimer);
    fjTimer = null;
  }
  
  fjQuestionModal.style.display = "none";
  
  // Set up answer display
  fjAnswerText.textContent = finalJeopardyData.answer;
  fjSourceLink.href = finalJeopardyData.source;
  
  // Generate scoring for each team
  fjTeamScoring.innerHTML = "";
  
  teams.forEach((team, index) => {
    const wager = fjWagers[index];
    const scoreRow = document.createElement("div");
    scoreRow.className = "fj-score-row";
    scoreRow.innerHTML = `
      <div class="fj-score-team">
        <span class="fj-score-dot" style="background-color: ${team.color}"></span>
        <span class="fj-score-name">${team.name}</span>
      </div>
      <div class="fj-score-wager">Wagered: $${wager.toLocaleString()}</div>
      <div class="fj-score-buttons">
        <button class="fj-correct-btn" data-team="${index}" data-wager="${wager}">✓ Correct (+$${wager.toLocaleString()})</button>
        <button class="fj-wrong-btn" data-team="${index}" data-wager="${wager}">✗ Wrong (-$${wager.toLocaleString()})</button>
      </div>
      <div class="fj-score-result" id="fj-result-${index}"></div>
    `;
    fjTeamScoring.appendChild(scoreRow);
  });
  
  // Add button handlers
  document.querySelectorAll(".fj-correct-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const teamIdx = parseInt(btn.dataset.team);
      const wager = parseInt(btn.dataset.wager);
      teams[teamIdx].score += wager;
      updateScoreDisplay(teamIdx);
      showFJResult(teamIdx, true, wager);
      btn.disabled = true;
      btn.parentElement.querySelector(".fj-wrong-btn").disabled = true;
    });
  });
  
  document.querySelectorAll(".fj-wrong-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const teamIdx = parseInt(btn.dataset.team);
      const wager = parseInt(btn.dataset.wager);
      teams[teamIdx].score -= wager;
      updateScoreDisplay(teamIdx);
      showFJResult(teamIdx, false, wager);
      btn.disabled = true;
      btn.parentElement.querySelector(".fj-correct-btn").disabled = true;
    });
  });
  
  fjAnswerModal.style.display = "flex";
}

function showFJResult(teamIdx, correct, wager) {
  const resultEl = document.querySelector(`#fj-result-${teamIdx}`);
  if (correct) {
    resultEl.innerHTML = `<span class="fj-result-correct">+$${wager.toLocaleString()}</span>`;
  } else {
    resultEl.innerHTML = `<span class="fj-result-wrong">-$${wager.toLocaleString()}</span>`;
  }
}

function showFinalResults() {
  fjAnswerModal.style.display = "none";
  
  // Sort teams by score
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  const winner = sortedTeams[0];
  
  // Check for tie
  const topScore = winner.score;
  const winners = sortedTeams.filter(t => t.score === topScore);
  
  if (winners.length > 1) {
    fjWinnerName.textContent = "🎉 It's a TIE! 🎉";
    fjWinnerName.style.backgroundColor = "transparent";
    fjWinnerScore.textContent = winners.map(w => w.name).join(" & ");
  } else {
    fjWinnerName.textContent = winner.name;
    fjWinnerName.style.backgroundColor = winner.color;
    fjWinnerScore.textContent = `$${winner.score.toLocaleString()}`;
  }
  
  // Show all standings
  fjFinalStandings.innerHTML = "<h3>Final Standings</h3>";
  sortedTeams.forEach((team, index) => {
    const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";
    const standing = document.createElement("div");
    standing.className = "fj-standing";
    standing.innerHTML = `
      <span class="fj-standing-rank">${medal} #${index + 1}</span>
      <span class="fj-standing-name" style="color: ${team.color}">${team.name}</span>
      <span class="fj-standing-score">$${team.score.toLocaleString()}</span>
    `;
    fjFinalStandings.appendChild(standing);
  });
  
  fjResultsModal.style.display = "flex";
}

function resetGame() {
  // Reset all state
  teams = [];
  currentQuestion = null;
  currentValue = 0;
  answeredQuestions.clear();
  dailyDoubles.clear();
  isDailyDouble = false;
  ddSelectedTeam = null;
  ddWagerAmount = 0;
  fjWagers = {};
  
  // Hide all modals
  fjResultsModal.style.display = "none";
  
  // Clear the game board
  document.querySelector(".container").innerHTML = "";
  
  // Re-fetch data and show setup
  fetchData();
  generateTeamInputs();
  setupModal.style.display = "flex";
  scoreboard.style.display = "none";
}

// ============================================
// EVENT LISTENERS
// ============================================
teamCountSelect.addEventListener("change", generateTeamInputs);

startGameBtn.addEventListener("click", () => {
  initializeTeams();
  initializeDailyDoubles();
  renderScoreboard();
  renderTeamButtons();
  setupModal.style.display = "none";
  scoreboard.style.display = "flex";
});

closeBtn.addEventListener("click", closeQuestion);

revealBtn.addEventListener("click", revealAnswer);

noPointsBtn.addEventListener("click", closeQuestion);

// Daily Double event listeners
ddConfirmWager.addEventListener("click", confirmWager);

ddCorrectBtn.addEventListener("click", ddCorrect);
ddWrongBtn.addEventListener("click", ddWrong);

// Quick wager buttons
document.querySelectorAll(".dd-quick-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const amount = btn.dataset.amount;
    if (amount === "max") {
      const team = teams[ddSelectedTeam];
      const maxBoardValue = 400;
      ddWagerInput.value = Math.max(team.score, maxBoardValue);
    } else {
      const team = teams[ddSelectedTeam];
      const maxBoardValue = 400;
      const maxWager = Math.max(team.score, maxBoardValue);
      ddWagerInput.value = Math.min(parseInt(amount), maxWager);
    }
  });
});

// Final Jeopardy event listeners
fjStartWagers.addEventListener("click", showFJWagerPhase);
fjLockWagers.addEventListener("click", lockFJWagers);
fjRevealAnswer.addEventListener("click", showFJAnswer);
fjShowResults.addEventListener("click", showFinalResults);
fjPlayAgain.addEventListener("click", resetGame);

// ============================================
// DATA LOADING & CARD CREATION
// ============================================
const objArr = [];
const cats = [];
const qArr = [];

async function fetchData() {
  try {
    const response = await fetch("./data.json");
    const data = await response.json();
    
    // Clear previous data
    objArr.length = 0;
    cats.length = 0;
    qArr.length = 0;
    
    for (const obj of data) {
      // Check if this is Final Jeopardy
      if (obj.finalJeopardy) {
        finalJeopardyData = obj;
        console.log("Final Jeopardy loaded:", obj.category);
      } else {
      objArr.push(obj);
      }
    }
    
    for (let cat in objArr) {
      cats.push(objArr[cat].category);
    }
    for (let qObj in objArr) {
      qArr.push(objArr[qObj].questions);
    }
    
    const cardCreator = new CardCreator(".container", cats, qArr);
    cardCreator.addCardsToContainer();

    return data;
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

// Card position mapping
const c1 = [7, 13, 19, 25];
const c2 = [8, 14, 20, 26];
const c3 = [9, 15, 21, 27];
const c4 = [10, 16, 22, 28];
const c5 = [11, 17, 23, 29];
const c6 = [12, 18, 24, 30];
const mainCats = [1, 2, 3, 4, 5, 6];
const qCards = [c1, c2, c3, c4, c5, c6];

class CardCreator {
  constructor(containerSelector, categories, questions) {
    this.container = document.querySelector(containerSelector);
    this.categories = categories;
    this.questions = questions;
    this.totalQuestions = [];
    this.questions.forEach((question) => {
      question.forEach((child) => {
        this.totalQuestions.push(child);
      });
    });
    this.totalCard = [...this.categories, ...this.totalQuestions];
  }

  createCard(content, isCategory = false) {
    const card = document.createElement("div");
    card.classList.add("card");
    if (isCategory) {
      card.classList.add("category-card");
    }
    card.innerHTML = `<p>${content}</p>`;
    return card;
  }

  addCardsToContainer() {
    let cardCounter = 0;
    
    this.totalCard.forEach((content, i) => {
      const indexVal = i + 1;
      
      if (mainCats.includes(indexVal)) {
        // Category header
        const card = this.createCard(content, true);
        this.container.appendChild(card);
      } else {
        // Question card
        let price;
        let priceValue;
        
        switch (true) {
          case indexVal >= 7 && indexVal <= 12:
            price = "$100";
            priceValue = 100;
            break;
          case indexVal >= 13 && indexVal <= 18:
            price = "$200";
            priceValue = 200;
            break;
          case indexVal >= 19 && indexVal <= 24:
            price = "$300";
            priceValue = 300;
            break;
          case indexVal >= 25 && indexVal <= 30:
            price = "$400";
            priceValue = 400;
            break;
          default:
            price = "Unknown";
            priceValue = 0;
            break;
        }

        let questionData;
        let curIndex;
        
        switch (true) {
          case c1.includes(indexVal):
            curIndex = c1.indexOf(indexVal);
            questionData = this.questions[0][curIndex];
            break;
          case c2.includes(indexVal):
            curIndex = c2.indexOf(indexVal);
            questionData = this.questions[1][curIndex];
            break;
          case c3.includes(indexVal):
            curIndex = c3.indexOf(indexVal);
            questionData = this.questions[2][curIndex];
            break;
          case c4.includes(indexVal):
            curIndex = c4.indexOf(indexVal);
            questionData = this.questions[3][curIndex];
            break;
          case c5.includes(indexVal):
            curIndex = c5.indexOf(indexVal);
            questionData = this.questions[4][curIndex];
            break;
          case c6.includes(indexVal):
            curIndex = c6.indexOf(indexVal);
            questionData = this.questions[5][curIndex];
            break;
          default:
            questionData = { question: "Unknown", answer: "Unknown", source: "#" };
            break;
        }

        const card = this.createCard(price);
        card.classList.add("question-card");
        card.dataset.cardId = `card-${cardCounter++}`;
        this.container.appendChild(card);
        
        card.addEventListener("click", () => {
          showQuestion(
            questionData.question,
            questionData.answer,
            questionData.source,
            priceValue,
            card
          );
        });
      }
    });
  }
}

// ============================================
// INITIALIZATION
// ============================================
generateTeamInputs();
fetchData();
