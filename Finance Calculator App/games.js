/* ========================================
   Finance Games - JavaScript
   ======================================== */

// Game State
let currentGame = null;
let gameState = {};

// High Scores (from localStorage)
const highScores = {
    budget: parseInt(localStorage.getItem('highScore_budget')) || 0,
    stocks: parseInt(localStorage.getItem('highScore_stocks')) || 0,
    savings: parseInt(localStorage.getItem('highScore_savings')) || 0,
    quiz: parseInt(localStorage.getItem('highScore_quiz')) || 0
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    updateHighScoreDisplay();
});

// Theme Toggle
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeToggle.textContent = '☀️ Light Mode';
    }
    
    themeToggle.addEventListener('click', () => {
        const isLight = document.body.classList.toggle('light-mode');
        themeToggle.textContent = isLight ? '☀️ Light Mode' : '🌙 Dark Mode';
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
}

// Update High Score Display
function updateHighScoreDisplay() {
    document.getElementById('budgetHighScore').textContent = `Best: $${highScores.budget.toLocaleString()} saved`;
    document.getElementById('stocksHighScore').textContent = `Best: $${highScores.stocks.toLocaleString()} profit`;
    document.getElementById('savingsHighScore').textContent = `Best: ${highScores.savings} points`;
    document.getElementById('quizHighScore').textContent = `Best: ${highScores.quiz}/10`;
}

// Start Game
function startGame(gameType) {
    currentGame = gameType;
    document.getElementById('gameArea').style.display = 'block';
    document.querySelector('.games-grid').style.display = 'none';
    
    // Hide all game containers
    document.querySelectorAll('.game-container').forEach(c => c.style.display = 'none');
    
    // Show and initialize selected game
    switch(gameType) {
        case 'budget':
            initBudgetGame();
            break;
        case 'stocks':
            initStocksGame();
            break;
        case 'savings':
            initSavingsGame();
            break;
        case 'quiz':
            initQuizGame();
            break;
    }
}

// Close Game
function closeGame() {
    document.getElementById('gameArea').style.display = 'none';
    document.querySelector('.games-grid').style.display = 'grid';
    currentGame = null;
    gameState = {};
}

// Restart Game
function restartGame() {
    if (currentGame) {
        startGame(currentGame);
    }
}

// Format Currency
function formatMoney(amount) {
    return '$' + Math.round(amount).toLocaleString();
}

/* ========================================
   BUDGET BLITZ GAME
   ======================================== */

const budgetScenarios = [
    {
        title: "🏠 Rent is Due!",
        description: "Your monthly rent payment is due. This is a fixed expense.",
        choices: [
            { text: "Pay full rent on time", cost: 1500, impact: 0, best: true },
            { text: "Pay late (add $50 fee)", cost: 1550, impact: -50, best: false },
            { text: "Move to cheaper place (moving costs)", cost: 2000, impact: 200, best: false }
        ]
    },
    {
        title: "🍕 Dinner Plans",
        description: "Friends invited you out for dinner. What do you do?",
        choices: [
            { text: "Expensive restaurant", cost: 80, impact: -20, best: false },
            { text: "Moderate restaurant", cost: 35, impact: 0, best: false },
            { text: "Cook at home & invite friends", cost: 15, impact: 20, best: true }
        ]
    },
    {
        title: "🚗 Car Trouble",
        description: "Your car needs unexpected repairs.",
        choices: [
            { text: "Fix at dealership (warranty)", cost: 500, impact: 0, best: false },
            { text: "Local mechanic (good reviews)", cost: 250, impact: 50, best: true },
            { text: "Ignore it for now", cost: 0, impact: -200, best: false }
        ]
    },
    {
        title: "📱 Phone Upgrade",
        description: "Your phone carrier is offering new phones.",
        choices: [
            { text: "Latest flagship phone", cost: 1200, impact: -50, best: false },
            { text: "Mid-range phone", cost: 400, impact: 0, best: false },
            { text: "Keep current phone", cost: 0, impact: 30, best: true }
        ]
    },
    {
        title: "🛒 Grocery Shopping",
        description: "Time for weekly grocery shopping.",
        choices: [
            { text: "Organic premium store", cost: 200, impact: -20, best: false },
            { text: "Regular supermarket with list", cost: 100, impact: 20, best: true },
            { text: "Fast food all week", cost: 150, impact: -40, best: false }
        ]
    },
    {
        title: "💡 Utility Bill",
        description: "Electricity bill arrived. Higher than expected!",
        choices: [
            { text: "Pay and forget about it", cost: 180, impact: -10, best: false },
            { text: "Pay and switch to LED bulbs", cost: 200, impact: 30, best: true },
            { text: "Dispute the bill (may add fees)", cost: 200, impact: -20, best: false }
        ]
    },
    {
        title: "🎁 Birthday Gift",
        description: "Your best friend's birthday is coming up.",
        choices: [
            { text: "Expensive designer gift", cost: 300, impact: -30, best: false },
            { text: "Thoughtful handmade gift", cost: 25, impact: 25, best: true },
            { text: "Gift card", cost: 50, impact: 0, best: false }
        ]
    },
    {
        title: "🏋️ Fitness Goals",
        description: "You want to get in shape. What's your plan?",
        choices: [
            { text: "Premium gym membership", cost: 100, impact: -20, best: false },
            { text: "Budget gym + home workouts", cost: 30, impact: 15, best: true },
            { text: "Buy expensive home equipment", cost: 800, impact: -50, best: false }
        ]
    },
    {
        title: "☕ Daily Coffee",
        description: "Your morning coffee routine needs deciding.",
        choices: [
            { text: "Fancy coffee shop daily", cost: 150, impact: -40, best: false },
            { text: "Brew at home", cost: 20, impact: 30, best: true },
            { text: "Mix: home + occasional treat", cost: 50, impact: 10, best: false }
        ]
    },
    {
        title: "📺 Entertainment",
        description: "Time to review your streaming subscriptions.",
        choices: [
            { text: "Keep all 5 services", cost: 75, impact: -20, best: false },
            { text: "Cancel unused, keep 2", cost: 25, impact: 25, best: true },
            { text: "Cancel all, free alternatives", cost: 0, impact: 15, best: false }
        ]
    },
    {
        title: "🚌 Transportation",
        description: "How will you get to work this month?",
        choices: [
            { text: "Drive alone (gas + parking)", cost: 300, impact: -20, best: false },
            { text: "Carpool with coworker", cost: 100, impact: 20, best: true },
            { text: "Uber/Lyft daily", cost: 450, impact: -50, best: false }
        ]
    },
    {
        title: "👔 Work Clothes",
        description: "You need new clothes for an important meeting.",
        choices: [
            { text: "Designer brand store", cost: 400, impact: -30, best: false },
            { text: "Thrift store + tailor", cost: 60, impact: 30, best: true },
            { text: "Online fast fashion", cost: 80, impact: 0, best: false }
        ]
    }
];

function initBudgetGame() {
    document.getElementById('budgetGame').style.display = 'block';
    
    gameState = {
        month: 1,
        income: 5000,
        remaining: 5000,
        savings: 0,
        totalMonths: 6,
        scenarioIndex: 0,
        scenarios: shuffleArray([...budgetScenarios]).slice(0, 12)
    };
    
    updateBudgetDisplay();
    showBudgetScenario();
}

function updateBudgetDisplay() {
    document.getElementById('budgetMonth').textContent = gameState.month;
    document.getElementById('budgetIncome').textContent = formatMoney(gameState.income);
    document.getElementById('budgetSavings').textContent = formatMoney(gameState.savings);
    document.getElementById('budgetRemaining').textContent = formatMoney(gameState.remaining);
    document.getElementById('budgetProgress').style.width = `${(gameState.scenarioIndex / gameState.scenarios.length) * 100}%`;
}

function showBudgetScenario() {
    if (gameState.scenarioIndex >= gameState.scenarios.length) {
        endBudgetGame();
        return;
    }
    
    // Check if starting new month
    if (gameState.scenarioIndex % 2 === 0 && gameState.scenarioIndex > 0) {
        // End of month - add remaining to savings, reset
        gameState.savings += Math.max(0, gameState.remaining);
        gameState.month++;
        gameState.remaining = gameState.income;
        updateBudgetDisplay();
    }
    
    const scenario = gameState.scenarios[gameState.scenarioIndex];
    
    document.getElementById('budgetScenario').innerHTML = `
        <h3>${scenario.title}</h3>
        <p>${scenario.description}</p>
    `;
    
    const choicesHtml = scenario.choices.map((choice, index) => `
        <button class="choice-btn" onclick="selectBudgetChoice(${index})">
            <span>${choice.text}</span>
            <span class="cost">-${formatMoney(choice.cost)}</span>
        </button>
    `).join('');
    
    document.getElementById('budgetChoices').innerHTML = choicesHtml;
    document.getElementById('budgetFeedback').style.display = 'none';
}

function selectBudgetChoice(index) {
    const scenario = gameState.scenarios[gameState.scenarioIndex];
    const choice = scenario.choices[index];
    
    // Apply choice
    gameState.remaining -= choice.cost;
    
    // Show feedback
    const feedback = document.getElementById('budgetFeedback');
    if (choice.best) {
        feedback.className = 'feedback-box correct';
        feedback.innerHTML = `✅ Great choice! You saved wisely. ${choice.impact > 0 ? `Bonus: +${formatMoney(choice.impact)} future savings!` : ''}`;
        gameState.savings += Math.max(0, choice.impact);
    } else if (choice.impact < 0) {
        feedback.className = 'feedback-box incorrect';
        feedback.innerHTML = `⚠️ That might not be the best choice. Impact: ${formatMoney(choice.impact)}`;
        gameState.savings += choice.impact;
    } else {
        feedback.className = 'feedback-box info';
        feedback.innerHTML = `👍 Okay choice! But there might be better options.`;
    }
    feedback.style.display = 'block';
    
    updateBudgetDisplay();
    
    // Next scenario after delay
    setTimeout(() => {
        gameState.scenarioIndex++;
        showBudgetScenario();
    }, 1500);
}

function endBudgetGame() {
    // Add final month's remaining to savings
    gameState.savings += Math.max(0, gameState.remaining);
    
    // Update high score
    if (gameState.savings > highScores.budget) {
        highScores.budget = gameState.savings;
        localStorage.setItem('highScore_budget', gameState.savings);
        updateHighScoreDisplay();
    }
    
    showGameOver('budget', {
        'Total Saved': formatMoney(gameState.savings),
        'Months Completed': gameState.month
    }, gameState.savings > 3000 ? '🌟 Excellent budgeting!' : 'Keep practicing your budgeting skills!');
}

/* ========================================
   STOCK MARKET SIMULATOR
   ======================================== */

const stockSymbols = [
    { symbol: 'TECH', name: 'TechCorp', basePrice: 150, volatility: 0.08 },
    { symbol: 'BANK', name: 'BankPlus', basePrice: 45, volatility: 0.04 },
    { symbol: 'HEALTH', name: 'HealthCo', basePrice: 80, volatility: 0.06 },
    { symbol: 'ENERGY', name: 'EnergyX', basePrice: 60, volatility: 0.10 },
    { symbol: 'RETAIL', name: 'ShopMart', basePrice: 35, volatility: 0.05 }
];

const stockNews = [
    { type: 'positive', symbol: 'TECH', headline: '🚀 Tech breakthrough announced!', impact: 0.15 },
    { type: 'negative', symbol: 'TECH', headline: '⚠️ Tech regulation concerns', impact: -0.10 },
    { type: 'positive', symbol: 'BANK', headline: '📈 Interest rates rising', impact: 0.08 },
    { type: 'negative', symbol: 'BANK', headline: '🏦 Bank loan defaults increase', impact: -0.12 },
    { type: 'positive', symbol: 'HEALTH', headline: '💊 New drug FDA approved!', impact: 0.20 },
    { type: 'negative', symbol: 'HEALTH', headline: '⚕️ Healthcare policy changes', impact: -0.08 },
    { type: 'positive', symbol: 'ENERGY', headline: '⚡ Oil prices surge globally', impact: 0.12 },
    { type: 'negative', symbol: 'ENERGY', headline: '🌍 Green energy push hurts oil', impact: -0.15 },
    { type: 'positive', symbol: 'RETAIL', headline: '🛍️ Holiday sales break records', impact: 0.10 },
    { type: 'negative', symbol: 'RETAIL', headline: '📦 Supply chain issues persist', impact: -0.07 },
    { type: 'neutral', symbol: 'ALL', headline: '📊 Market trading sideways today', impact: 0 }
];

function initStocksGame() {
    document.getElementById('stocksGame').style.display = 'block';
    
    // Initialize stocks with random starting prices
    const stocks = stockSymbols.map(s => ({
        ...s,
        price: s.basePrice * (0.9 + Math.random() * 0.2),
        previousPrice: s.basePrice,
        history: []
    }));
    
    gameState = {
        day: 1,
        totalDays: 20,
        cash: 10000,
        stocks: stocks,
        holdings: {},
        currentNews: null
    };
    
    updateStocksDisplay();
}

function updateStocksDisplay() {
    document.getElementById('stockDay').textContent = gameState.day;
    document.getElementById('stockCash').textContent = formatMoney(gameState.cash);
    
    // Calculate portfolio value
    let portfolioValue = 0;
    for (const symbol in gameState.holdings) {
        const stock = gameState.stocks.find(s => s.symbol === symbol);
        portfolioValue += stock.price * gameState.holdings[symbol];
    }
    
    document.getElementById('stockPortfolio').textContent = formatMoney(portfolioValue);
    document.getElementById('stockTotal').textContent = formatMoney(gameState.cash + portfolioValue);
    document.getElementById('stockProgress').style.width = `${(gameState.day / gameState.totalDays) * 100}%`;
    
    // Update stock ticker
    const tickerHtml = gameState.stocks.map(stock => {
        const change = ((stock.price - stock.previousPrice) / stock.previousPrice * 100).toFixed(1);
        const isUp = stock.price >= stock.previousPrice;
        return `
            <div class="stock-item" onclick="openTradeModal('${stock.symbol}')">
                <div class="stock-symbol">${stock.symbol}</div>
                <div class="stock-price">${formatMoney(stock.price)}</div>
                <div class="stock-change ${isUp ? 'up' : 'down'}">${isUp ? '▲' : '▼'} ${Math.abs(change)}%</div>
            </div>
        `;
    }).join('');
    document.getElementById('stockTicker').innerHTML = tickerHtml;
    
    // Update news
    if (gameState.currentNews) {
        document.getElementById('stockNews').innerHTML = `
            <h4>📰 Market News</h4>
            <p>${gameState.currentNews.headline}</p>
        `;
    }
    
    // Update holdings
    const holdingsHtml = Object.entries(gameState.holdings)
        .filter(([_, qty]) => qty > 0)
        .map(([symbol, qty]) => {
            const stock = gameState.stocks.find(s => s.symbol === symbol);
            return `
                <div class="holding-item">
                    <span>${symbol}: ${qty} shares @ ${formatMoney(stock.price)}</span>
                    <span>${formatMoney(stock.price * qty)}</span>
                </div>
            `;
        }).join('');
    
    document.getElementById('stockHoldings').innerHTML = holdingsHtml 
        ? `<h4>📊 Your Holdings</h4>${holdingsHtml}` 
        : '<h4>📊 Your Holdings</h4><p style="color: var(--text-secondary)">No stocks owned yet</p>';
}

function openTradeModal(symbol) {
    const stock = gameState.stocks.find(s => s.symbol === symbol);
    const owned = gameState.holdings[symbol] || 0;
    const maxBuy = Math.floor(gameState.cash / stock.price);
    
    const modal = document.createElement('div');
    modal.className = 'trade-modal';
    modal.innerHTML = `
        <div class="trade-modal-content">
            <h3>Trade ${symbol}</h3>
            <p style="color: var(--text-secondary); margin-bottom: 15px;">Current Price: ${formatMoney(stock.price)} | Owned: ${owned}</p>
            <div class="trade-input-group">
                <label>Quantity</label>
                <input type="number" id="tradeQty" min="1" max="${maxBuy}" value="1">
            </div>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 15px;">Max you can buy: ${maxBuy}</p>
            <div class="trade-modal-actions">
                <button class="btn-buy" onclick="executeTrade('${symbol}', 'buy')">Buy</button>
                <button class="btn-sell" onclick="executeTrade('${symbol}', 'sell')" ${owned === 0 ? 'disabled style="opacity: 0.5"' : ''}>Sell</button>
                <button class="btn-secondary" onclick="closeTradeModal()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeTradeModal() {
    const modal = document.querySelector('.trade-modal');
    if (modal) modal.remove();
}

function executeTrade(symbol, action) {
    const qty = parseInt(document.getElementById('tradeQty').value) || 0;
    const stock = gameState.stocks.find(s => s.symbol === symbol);
    
    if (qty <= 0) {
        alert('Enter a valid quantity');
        return;
    }
    
    if (action === 'buy') {
        const cost = stock.price * qty;
        if (cost > gameState.cash) {
            alert('Not enough cash!');
            return;
        }
        gameState.cash -= cost;
        gameState.holdings[symbol] = (gameState.holdings[symbol] || 0) + qty;
    } else {
        const owned = gameState.holdings[symbol] || 0;
        if (qty > owned) {
            alert('You don\'t own that many shares!');
            return;
        }
        gameState.cash += stock.price * qty;
        gameState.holdings[symbol] -= qty;
    }
    
    closeTradeModal();
    updateStocksDisplay();
}

function nextStockDay() {
    if (gameState.day >= gameState.totalDays) {
        endStocksGame();
        return;
    }
    
    // Generate news
    const newsItem = stockNews[Math.floor(Math.random() * stockNews.length)];
    gameState.currentNews = newsItem;
    
    // Update stock prices
    gameState.stocks.forEach(stock => {
        stock.previousPrice = stock.price;
        
        // Random movement
        const randomChange = (Math.random() - 0.5) * 2 * stock.volatility;
        
        // News impact
        let newsImpact = 0;
        if (newsItem.symbol === stock.symbol || newsItem.symbol === 'ALL') {
            newsImpact = newsItem.impact;
        }
        
        // Apply changes
        stock.price = stock.price * (1 + randomChange + newsImpact);
        stock.price = Math.max(5, stock.price); // Minimum price
        stock.history.push(stock.price);
    });
    
    gameState.day++;
    updateStocksDisplay();
}

function endStocksGame() {
    // Calculate final portfolio value
    let portfolioValue = 0;
    for (const symbol in gameState.holdings) {
        const stock = gameState.stocks.find(s => s.symbol === symbol);
        portfolioValue += stock.price * gameState.holdings[symbol];
    }
    
    const totalValue = gameState.cash + portfolioValue;
    const profit = totalValue - 10000;
    
    // Update high score
    if (profit > highScores.stocks) {
        highScores.stocks = Math.round(profit);
        localStorage.setItem('highScore_stocks', Math.round(profit));
        updateHighScoreDisplay();
    }
    
    showGameOver('stocks', {
        'Final Portfolio': formatMoney(totalValue),
        'Total Profit': formatMoney(profit)
    }, profit > 2000 ? '🎉 Amazing trading skills!' : profit > 0 ? '👍 Not bad!' : 'Markets can be tough!');
}

/* ========================================
   52-WEEK SAVINGS CHALLENGE
   ======================================== */

function initSavingsGame() {
    document.getElementById('savingsGame').style.display = 'block';
    
    gameState = {
        week: 1,
        totalWeeks: 12, // Simplified to 12 weeks
        saved: 0,
        score: 0,
        goalAmount: 0,
        tiles: [],
        selectedTile: null,
        matchedPairs: 0
    };
    
    generateSavingsGrid();
    updateSavingsDisplay();
}

function generateSavingsGrid() {
    const weekAmount = gameState.week;
    gameState.goalAmount = weekAmount;
    
    // Create 8 pairs of matching amounts
    const amounts = [];
    for (let i = 0; i < 8; i++) {
        const amount = Math.floor(Math.random() * 50) + 1;
        amounts.push(amount, amount);
    }
    
    // Make sure the goal amount is in there
    amounts[0] = weekAmount;
    amounts[1] = weekAmount;
    
    // Shuffle
    gameState.tiles = shuffleArray(amounts).map((value, index) => ({
        id: index,
        value: value,
        matched: false,
        selected: false
    }));
    
    renderSavingsGrid();
}

function renderSavingsGrid() {
    const gridHtml = gameState.tiles.map(tile => `
        <div class="savings-tile ${tile.matched ? 'matched' : ''} ${tile.selected ? 'selected' : ''}" 
             onclick="selectSavingsTile(${tile.id})"
             ${tile.matched ? 'style="pointer-events: none"' : ''}>
            $${tile.value}
        </div>
    `).join('');
    
    document.getElementById('savingsGrid').innerHTML = gridHtml;
    document.getElementById('savingsPrompt').textContent = `Find matching $${gameState.goalAmount} pairs!`;
}

function updateSavingsDisplay() {
    document.getElementById('savingsWeek').textContent = gameState.week;
    document.getElementById('savingsGoal').textContent = `$${gameState.goalAmount}`;
    document.getElementById('savingsTotal').textContent = formatMoney(gameState.saved);
    document.getElementById('savingsScore').textContent = gameState.score;
    document.getElementById('savingsProgress').style.width = `${(gameState.week / gameState.totalWeeks) * 100}%`;
}

function selectSavingsTile(id) {
    const tile = gameState.tiles.find(t => t.id === id);
    if (tile.matched || tile.selected) return;
    
    tile.selected = true;
    renderSavingsGrid();
    
    if (gameState.selectedTile === null) {
        gameState.selectedTile = tile;
    } else {
        // Check for match
        if (gameState.selectedTile.value === tile.value) {
            // Match found!
            tile.matched = true;
            gameState.selectedTile.matched = true;
            gameState.matchedPairs++;
            
            // Bonus for matching goal amount
            if (tile.value === gameState.goalAmount) {
                gameState.score += 50;
                gameState.saved += gameState.goalAmount * 2;
            } else {
                gameState.score += 10;
            }
            
            gameState.selectedTile = null;
            renderSavingsGrid();
            updateSavingsDisplay();
            
            // Check if all matched
            if (gameState.matchedPairs >= 8) {
                setTimeout(() => nextSavingsWeek(), 500);
            }
        } else {
            // No match
            setTimeout(() => {
                tile.selected = false;
                gameState.selectedTile.selected = false;
                gameState.selectedTile = null;
                renderSavingsGrid();
            }, 500);
        }
    }
}

function nextSavingsWeek() {
    gameState.week++;
    gameState.matchedPairs = 0;
    
    if (gameState.week > gameState.totalWeeks) {
        endSavingsGame();
        return;
    }
    
    generateSavingsGrid();
    updateSavingsDisplay();
}

function endSavingsGame() {
    // Update high score
    if (gameState.score > highScores.savings) {
        highScores.savings = gameState.score;
        localStorage.setItem('highScore_savings', gameState.score);
        updateHighScoreDisplay();
    }
    
    showGameOver('savings', {
        'Total Score': gameState.score,
        'Amount Saved': formatMoney(gameState.saved)
    }, gameState.score > 500 ? '🏆 Savings master!' : 'Great practice!');
}

/* ========================================
   FINANCIAL TRIVIA QUIZ
   ======================================== */

const quizQuestions = [
    {
        question: "What does 'APR' stand for in finance?",
        options: ["Annual Percentage Rate", "Average Price Return", "Annual Payment Required", "Approved Purchase Rate"],
        correct: 0,
        explanation: "APR is the Annual Percentage Rate - the yearly interest rate charged on borrowed money."
    },
    {
        question: "What is the '50/30/20' budget rule?",
        options: ["50% taxes, 30% savings, 20% spending", "50% needs, 30% wants, 20% savings", "50% savings, 30% needs, 20% wants", "50% rent, 30% food, 20% other"],
        correct: 1,
        explanation: "The 50/30/20 rule suggests allocating 50% to needs, 30% to wants, and 20% to savings."
    },
    {
        question: "What is compound interest?",
        options: ["Interest on principal only", "Interest on interest + principal", "A type of bank fee", "Government tax on savings"],
        correct: 1,
        explanation: "Compound interest is interest calculated on both the principal and accumulated interest."
    },
    {
        question: "What is a 401(k)?",
        options: ["A type of mortgage", "Retirement savings plan", "Tax form number", "Credit score category"],
        correct: 1,
        explanation: "A 401(k) is an employer-sponsored retirement savings plan with tax advantages."
    },
    {
        question: "What does 'diversification' mean in investing?",
        options: ["Buying one good stock", "Spreading investments across different assets", "Investing in foreign currency only", "Timing the market"],
        correct: 1,
        explanation: "Diversification means spreading investments to reduce risk."
    },
    {
        question: "What is a credit score primarily used for?",
        options: ["Determining your salary", "Measuring your wealth", "Assessing creditworthiness", "Calculating taxes"],
        correct: 2,
        explanation: "Credit scores help lenders assess your ability to repay borrowed money."
    },
    {
        question: "What is an emergency fund?",
        options: ["Government bailout", "Savings for unexpected expenses", "Credit card limit", "Insurance policy"],
        correct: 1,
        explanation: "An emergency fund is savings set aside for unexpected financial needs."
    },
    {
        question: "What is the 'Rule of 72' used for?",
        options: ["Calculating tax returns", "Estimating investment doubling time", "Determining retirement age", "Setting budget limits"],
        correct: 1,
        explanation: "The Rule of 72 estimates how long it takes for an investment to double."
    },
    {
        question: "What is inflation?",
        options: ["Increase in stock prices", "Decrease in purchasing power over time", "Bank interest rate", "Government spending"],
        correct: 1,
        explanation: "Inflation is the rate at which prices rise and purchasing power falls."
    },
    {
        question: "What is a mutual fund?",
        options: ["Loan between friends", "Pool of investments from multiple investors", "Government bond", "Bank savings account"],
        correct: 1,
        explanation: "A mutual fund pools money from many investors to invest in various securities."
    },
    {
        question: "What is net worth?",
        options: ["Annual salary", "Assets minus liabilities", "Credit limit", "Monthly income"],
        correct: 1,
        explanation: "Net worth is the difference between what you own (assets) and what you owe (liabilities)."
    },
    {
        question: "What is a bear market?",
        options: ["Market with high growth", "Market decline of 20% or more", "New trading platform", "European stock exchange"],
        correct: 1,
        explanation: "A bear market is characterized by falling prices, typically 20% or more from recent highs."
    },
    {
        question: "What is liquidity?",
        options: ["Bank account balance", "Ease of converting assets to cash", "Type of investment", "Interest rate"],
        correct: 1,
        explanation: "Liquidity refers to how quickly and easily an asset can be converted to cash."
    },
    {
        question: "What is a dividend?",
        options: ["Company debt", "Profit distributed to shareholders", "Tax payment", "Stock price"],
        correct: 1,
        explanation: "Dividends are portions of company profits distributed to shareholders."
    },
    {
        question: "What is dollar-cost averaging?",
        options: ["Exchanging currency", "Investing fixed amounts regularly", "Averaging stock prices", "Calculating returns"],
        correct: 1,
        explanation: "Dollar-cost averaging means investing a fixed amount regularly regardless of price."
    }
];

let quizTimer = null;

function initQuizGame() {
    document.getElementById('quizGame').style.display = 'block';
    
    gameState = {
        questionIndex: 0,
        score: 0,
        streak: 0,
        timeLeft: 15,
        questions: shuffleArray([...quizQuestions]).slice(0, 10)
    };
    
    showQuizQuestion();
}

function showQuizQuestion() {
    if (gameState.questionIndex >= gameState.questions.length) {
        endQuizGame();
        return;
    }
    
    const q = gameState.questions[gameState.questionIndex];
    
    document.getElementById('quizQuestion').textContent = `${gameState.questionIndex + 1}/10`;
    document.getElementById('quizScore').textContent = gameState.score;
    document.getElementById('quizStreak').textContent = `${gameState.streak} 🔥`;
    document.getElementById('quizProgress').style.width = `${(gameState.questionIndex / gameState.questions.length) * 100}%`;
    
    document.getElementById('quizText').textContent = q.question;
    
    const optionsHtml = q.options.map((opt, i) => `
        <button class="quiz-option" onclick="selectQuizOption(${i})">${opt}</button>
    `).join('');
    document.getElementById('quizOptions').innerHTML = optionsHtml;
    document.getElementById('quizFeedback').style.display = 'none';
    
    // Start timer
    gameState.timeLeft = 15;
    updateQuizTimer();
    
    if (quizTimer) clearInterval(quizTimer);
    quizTimer = setInterval(() => {
        gameState.timeLeft--;
        updateQuizTimer();
        
        if (gameState.timeLeft <= 0) {
            clearInterval(quizTimer);
            selectQuizOption(-1); // Time up - wrong answer
        }
    }, 1000);
}

function updateQuizTimer() {
    const timerEl = document.getElementById('quizTimer');
    timerEl.textContent = `${gameState.timeLeft}s`;
    timerEl.style.color = gameState.timeLeft <= 5 ? 'var(--accent-danger)' : 'var(--accent-primary)';
}

function selectQuizOption(index) {
    clearInterval(quizTimer);
    
    const q = gameState.questions[gameState.questionIndex];
    const options = document.querySelectorAll('.quiz-option');
    
    options.forEach((opt, i) => {
        opt.classList.add('disabled');
        if (i === q.correct) {
            opt.classList.add('correct');
        } else if (i === index) {
            opt.classList.add('incorrect');
        }
    });
    
    const feedback = document.getElementById('quizFeedback');
    
    if (index === q.correct) {
        const points = 10 + gameState.streak * 2 + Math.floor(gameState.timeLeft / 3);
        gameState.score += points;
        gameState.streak++;
        feedback.className = 'feedback-box correct';
        feedback.innerHTML = `✅ Correct! +${points} points<br><small>${q.explanation}</small>`;
    } else {
        gameState.streak = 0;
        feedback.className = 'feedback-box incorrect';
        feedback.innerHTML = `❌ ${index === -1 ? "Time's up!" : 'Wrong!'}<br><small>${q.explanation}</small>`;
    }
    feedback.style.display = 'block';
    
    document.getElementById('quizScore').textContent = gameState.score;
    document.getElementById('quizStreak').textContent = `${gameState.streak} 🔥`;
    
    setTimeout(() => {
        gameState.questionIndex++;
        showQuizQuestion();
    }, 2500);
}

function endQuizGame() {
    if (quizTimer) clearInterval(quizTimer);
    
    const correctCount = Math.floor(gameState.score / 10);
    
    // Update high score
    if (gameState.score > highScores.quiz) {
        highScores.quiz = gameState.score;
        localStorage.setItem('highScore_quiz', gameState.score);
        updateHighScoreDisplay();
    }
    
    showGameOver('quiz', {
        'Final Score': gameState.score,
        'Best Streak': `${gameState.streak} 🔥`
    }, gameState.score > 100 ? '🧠 Financial genius!' : 'Keep learning about finance!');
}

/* ========================================
   GAME OVER SCREEN
   ======================================== */

function showGameOver(gameType, stats, message) {
    // Hide current game
    document.querySelectorAll('.game-container').forEach(c => c.style.display = 'none');
    
    const gameOver = document.getElementById('gameOver');
    gameOver.style.display = 'block';
    
    // Set icon based on game type
    const icons = { budget: '💰', stocks: '📈', savings: '🏦', quiz: '🧠' };
    document.getElementById('gameOverIcon').textContent = icons[gameType] || '🏆';
    
    // Set stats
    const statsHtml = Object.entries(stats).map(([label, value]) => `
        <div class="stat-item">
            <span class="stat-label">${label}</span>
            <span class="stat-value">${value}</span>
        </div>
    `).join('');
    document.getElementById('gameOverStats').innerHTML = statsHtml;
    
    document.getElementById('gameOverMessage').textContent = message;
}

/* ========================================
   UTILITY FUNCTIONS
   ======================================== */

function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
