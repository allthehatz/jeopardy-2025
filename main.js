// ============================================
// GAME STATE
// ============================================
let teams = [];
let currentQuestion = null;
let currentValue = 0;
let answeredQuestions = new Set();

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
  
  // Reset modal state
  qText.textContent = question;
  questionValue.textContent = `$${value}`;
  answerText.textContent = answer;
  sourceLink.href = source;
  
  // Hide answer section initially
  answerReveal.style.display = "none";
  revealBtn.style.display = "block";
  scoringSection.style.display = "none";
  
  // Show modal
  qDiv.style.display = "flex";
}

function revealAnswer() {
  revealBtn.style.display = "none";
  answerReveal.style.display = "flex";
  scoringSection.style.display = "block";
}

function closeQuestion() {
  qDiv.style.display = "none";
  
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
  if (answeredQuestions.size === totalQuestions) {
    setTimeout(() => {
      const winner = teams.reduce((prev, curr) => 
        prev.score > curr.score ? prev : curr
      );
      alert(`🎉 Game Over! 🎉\n\nWinner: ${winner.name} with $${winner.score.toLocaleString()}!\n\nHappy New Year!`);
    }, 500);
  }
}

// ============================================
// EVENT LISTENERS
// ============================================
teamCountSelect.addEventListener("change", generateTeamInputs);

startGameBtn.addEventListener("click", () => {
  initializeTeams();
  renderScoreboard();
  renderTeamButtons();
  setupModal.style.display = "none";
  scoreboard.style.display = "flex";
});

closeBtn.addEventListener("click", closeQuestion);

revealBtn.addEventListener("click", revealAnswer);

noPointsBtn.addEventListener("click", closeQuestion);

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
    
    for (const obj of data) {
      objArr.push(obj);
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
