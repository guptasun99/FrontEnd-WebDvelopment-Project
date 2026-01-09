// Finance Calculator Pro - Professional Financial Planning Tools
let charts = {};
let chartData = {}; // Store data for view switching
let mathExpression = '';
let mathHistoryArr = [];
let currentChartView = {}; // Track current view (yearly/monthly) per calculator

// Get theme-aware chart colors
function getChartColors() {
	const isLight = document.body.classList.contains('light-mode');
	return {
		textColor: isLight ? '#475569' : '#94a3b8',
		gridColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
		tooltipBg: isLight ? '#fff' : '#1e1e32',
		tooltipText: isLight ? '#1e293b' : '#f1f5f9'
	};
}

function switchCalc(calcId) {
	document.querySelectorAll('.calculator').forEach(c => c.classList.remove('active'));
	document.querySelectorAll('.calc-btn').forEach(b => b.classList.remove('active'));
	document.getElementById(calcId).classList.add('active');
	if (window.event && event.target) {
		const btn = event.target.closest('.calc-btn');
		if (btn) btn.classList.add('active');
	}
}

function switchKnowledge(tabId) {
	document.querySelectorAll('.knowledge-content').forEach(c => c.classList.remove('active'));
	document.querySelectorAll('.knowledge-tab').forEach(t => t.classList.remove('active'));
	document.getElementById(tabId).classList.add('active');
	if (window.event && event.target) {
		event.target.classList.add('active');
	}
}

function formatCurrency(num) {
	if (isNaN(num) || !isFinite(num)) return '$0.00';
	return '$' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatPercent(num) {
	if (isNaN(num) || !isFinite(num)) return '0.00%';
	return num.toFixed(2) + '%';
}

function formatCompact(num) {
	if (num >= 1000000) return '$' + (num / 1000000).toFixed(1) + 'M';
	if (num >= 1000) return '$' + (num / 1000).toFixed(1) + 'K';
	return formatCurrency(num);
}

// Toggle between yearly and monthly chart views
function toggleChartView(calculatorId, view) {
	currentChartView[calculatorId] = view;
	
	// Update button states
	const container = document.querySelector(`#${calculatorId}`);
	if (container) {
		container.querySelectorAll('.chart-view-btn').forEach(btn => {
			btn.classList.remove('active');
			if (btn.textContent.toLowerCase() === view) btn.classList.add('active');
		});
	}
	
	// Re-render chart with new view based on calculator type
	if (!chartData[calculatorId]) return;
	
	const renderFunctions = {
		compound: () => renderChart('compound', view),
		simple: () => renderSimpleChart(view),
		cagr: () => renderCagrChart(view),
		loan: () => renderLoanChart(view),
		mortgage: () => renderMortgageChart(view),
		investment: () => renderInvestmentChart(view),
		retirement: () => renderRetirementChart(view),
		savings: () => renderSavingsChart(view),
		roi: () => renderRoiChart(view)
	};
	
	if (renderFunctions[calculatorId]) {
		renderFunctions[calculatorId]();
	}
}

// Compound Interest Calculator - Corrected Formula
// A = P(1 + r/n)^(nt) + PMT × [((1 + r/n)^(nt) - 1) / (r/n)]
function calculateCompoundInterest() {
	const P = parseFloat(document.getElementById('ciPrincipal').value) || 0;
	const r = parseFloat(document.getElementById('ciRate').value) / 100 || 0;
	const t = parseFloat(document.getElementById('ciTime').value) || 0;
	const n = parseFloat(document.getElementById('ciCompounding').value) || 12;
	const monthly = parseFloat(document.getElementById('ciMonthlyAdd').value) || 0;

	// Validate inputs
	if (P < 0 || r < 0 || t <= 0) {
		alert('Please enter valid positive values');
		return;
	}

	// Calculate using proper compound interest formula with contributions
	const monthlyLabels = [];
	const monthlyBalanceData = [];
	const monthlyContributionsData = [];
	const yearlyLabels = [];
	const yearlyBalanceData = [];
	const yearlyContributionsData = [];
	
	let balance = P;
	let totalContributions = P;
	const periodsPerYear = n;
	const ratePerPeriod = r / n;
	
	// Calculate month by month for accuracy
	const totalMonths = t * 12;
	
	for (let month = 0; month <= totalMonths; month++) {
		// Store monthly data
		monthlyLabels.push(`Month ${month}`);
		monthlyBalanceData.push(balance);
		monthlyContributionsData.push(totalContributions);
		
		// Store yearly data at year boundaries
		if (month % 12 === 0) {
			yearlyLabels.push(`Year ${month / 12}`);
			yearlyBalanceData.push(balance);
			yearlyContributionsData.push(totalContributions);
		}
		
		if (month < totalMonths) {
			// Apply compounding based on frequency
			if (n === 12) {
				// Monthly compounding
				balance = balance * (1 + ratePerPeriod) + monthly;
			} else if (n === 365) {
				// Daily compounding - approximate for the month
				const daysInMonth = 30;
				for (let d = 0; d < daysInMonth; d++) {
					balance = balance * (1 + r / 365);
				}
				balance += monthly;
			} else {
				// Other frequencies
				balance = balance * Math.pow(1 + ratePerPeriod, n / 12) + monthly;
			}
			totalContributions += monthly;
		}
	}

	const finalAmount = balance;
	const totalContrib = P + (monthly * totalMonths);
	const interestEarned = finalAmount - totalContrib;
	const effectiveReturn = totalContrib > 0 ? (interestEarned / totalContrib) * 100 : 0;

	const results = document.getElementById('compoundResults');
	results.innerHTML = `
		<div class="results-header">
			<span class="results-title">📊 Calculation Results</span>
		</div>
		<div class="result-item"><span class="result-label">Final Amount:</span><span class="result-value highlight">${formatCurrency(finalAmount)}</span></div>
		<div class="result-item"><span class="result-label">Principal Amount:</span><span class="result-value">${formatCurrency(P)}</span></div>
		<div class="result-item"><span class="result-label">Total Contributions:</span><span class="result-value">${formatCurrency(totalContrib)}</span></div>
		<div class="result-item"><span class="result-label">Interest Earned:</span><span class="result-value text-success">${formatCurrency(interestEarned)}</span></div>
		<div class="result-item"><span class="result-label">Effective Return:</span><span class="result-value">${formatPercent(effectiveReturn)}</span></div>
		<div class="result-item"><span class="result-label">Monthly Interest (avg):</span><span class="result-value">${formatCurrency(interestEarned / totalMonths)}</span></div>
	`;
	results.classList.add('show');

	// Store data for view switching
	chartData.compound = {
		yearly: { labels: yearlyLabels, balance: yearlyBalanceData, contributions: yearlyContributionsData },
		monthly: { labels: monthlyLabels, balance: monthlyBalanceData, contributions: monthlyContributionsData }
	};
	
	currentChartView.compound = currentChartView.compound || 'yearly';
	renderChart('compound', currentChartView.compound);
}

function renderChart(calculatorId, view) {
	const data = chartData[calculatorId];
	if (!data) return;
	
	const viewData = data[view];
	const colors = getChartColors();
	
	if (calculatorId === 'compound') {
		if (charts.compound) charts.compound.destroy();
		const ctx = document.getElementById('compoundChart').getContext('2d');
		charts.compound = new Chart(ctx, {
			type: 'line',
			data: {
				labels: viewData.labels,
				datasets: [
					{
						label: 'Total Balance',
						data: viewData.balance,
						borderColor: '#667eea',
						backgroundColor: 'rgba(102, 126, 234, 0.1)',
						fill: true,
						tension: 0.4,
						borderWidth: 3,
						pointRadius: view === 'yearly' ? 4 : 0,
						pointHoverRadius: 6,
					},
					{
						label: 'Total Contributions',
						data: viewData.contributions,
						borderColor: '#10b981',
						backgroundColor: 'rgba(16, 185, 129, 0.1)',
						fill: true,
						tension: 0.4,
						borderWidth: 2,
						pointRadius: view === 'yearly' ? 3 : 0,
						pointHoverRadius: 5,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: { intersect: false, mode: 'index' },
				plugins: {
					legend: { position: 'bottom', labels: { color: colors.textColor, padding: 15, usePointStyle: true } },
					tooltip: {
						backgroundColor: colors.tooltipBg,
						titleColor: colors.tooltipText,
						bodyColor: colors.tooltipText,
						borderColor: colors.gridColor,
						borderWidth: 1,
						callbacks: {
							label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`
						}
					}
				},
				scales: {
					x: { ticks: { color: colors.textColor, maxTicksLimit: view === 'monthly' ? 12 : 20 }, grid: { color: colors.gridColor } },
					y: { ticks: { color: colors.textColor, callback: (v) => formatCompact(v) }, grid: { color: colors.gridColor } },
				},
			},
		});
	}
}

// Simple Interest Calculator - I = P × r × t
function calculateSimpleInterest() {
	const P = parseFloat(document.getElementById('siPrincipal').value) || 0;
	const r = parseFloat(document.getElementById('siRate').value) / 100 || 0;
	const t = parseFloat(document.getElementById('siTime').value) || 0;

	if (P <= 0 || t <= 0) {
		alert('Please enter valid positive values');
		return;
	}

	const interest = P * r * t;
	const totalAmount = P + interest;
	const monthlyInterest = interest / (t * 12);
	const yearlyInterest = interest / t;

	const results = document.getElementById('simpleResults');
	results.innerHTML = `
		<div class="results-header">
			<span class="results-title">📊 Calculation Results</span>
		</div>
		<div class="result-item"><span class="result-label">Total Amount:</span><span class="result-value highlight">${formatCurrency(totalAmount)}</span></div>
		<div class="result-item"><span class="result-label">Principal Amount:</span><span class="result-value">${formatCurrency(P)}</span></div>
		<div class="result-item"><span class="result-label">Total Interest:</span><span class="result-value text-success">${formatCurrency(interest)}</span></div>
		<div class="result-item"><span class="result-label">Yearly Interest:</span><span class="result-value">${formatCurrency(yearlyInterest)}</span></div>
		<div class="result-item"><span class="result-label">Monthly Interest:</span><span class="result-value">${formatCurrency(monthlyInterest)}</span></div>
	`;
	results.classList.add('show');

	// Generate monthly and yearly data
	const yearlyLabels = [];
	const yearlyPrincipal = [];
	const yearlyInterestData = [];
	const monthlyLabels = [];
	const monthlyPrincipal = [];
	const monthlyInterestData = [];
	const totalMonths = Math.ceil(t * 12);
	
	for (let month = 0; month <= totalMonths; month++) {
		const timeInYears = month / 12;
		monthlyLabels.push(`Month ${month}`);
		monthlyPrincipal.push(P);
		monthlyInterestData.push(P * r * timeInYears);
		
		if (month % 12 === 0) {
			yearlyLabels.push(`Year ${month / 12}`);
			yearlyPrincipal.push(P);
			yearlyInterestData.push(P * r * timeInYears);
		}
	}

	// Store for view switching
	chartData.simple = {
		yearly: { labels: yearlyLabels, principal: yearlyPrincipal, interest: yearlyInterestData },
		monthly: { labels: monthlyLabels, principal: monthlyPrincipal, interest: monthlyInterestData }
	};
	
	currentChartView.simple = currentChartView.simple || 'yearly';
	renderSimpleChart(currentChartView.simple);
}

function renderSimpleChart(view) {
	const data = chartData.simple;
	if (!data) return;
	
	const viewData = data[view];
	const colors = getChartColors();

	if (charts.simple) charts.simple.destroy();
	const ctx = document.getElementById('simpleChart').getContext('2d');
	charts.simple = new Chart(ctx, {
		type: 'bar',
		data: {
			labels: viewData.labels,
			datasets: [
				{ label: 'Principal', data: viewData.principal, backgroundColor: '#667eea', borderRadius: 4 },
				{ label: 'Interest Earned', data: viewData.interest, backgroundColor: '#10b981', borderRadius: 4 },
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { position: 'bottom', labels: { color: colors.textColor, padding: 15, usePointStyle: true } },
				tooltip: {
					callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` }
				}
			},
			scales: {
				x: { stacked: true, ticks: { color: colors.textColor, maxTicksLimit: 12 }, grid: { color: colors.gridColor } },
				y: { stacked: true, ticks: { color: colors.textColor, callback: (v) => formatCompact(v) }, grid: { color: colors.gridColor } },
			},
		},
	});
}

// CAGR Calculator - CAGR = (FV/PV)^(1/n) - 1
function calculateCAGR() {
	const initial = parseFloat(document.getElementById('cagrInitial').value) || 0;
	const final = parseFloat(document.getElementById('cagrFinal').value) || 0;
	const years = parseFloat(document.getElementById('cagrYears').value) || 0;

	if (initial <= 0 || final <= 0 || years <= 0) {
		alert('Please enter valid positive values');
		return;
	}

	const cagr = (Math.pow(final / initial, 1 / years) - 1) * 100;
	const totalReturn = ((final - initial) / initial) * 100;
	const absoluteReturn = final - initial;
	const avgYearlyGrowth = absoluteReturn / years;
	const avgMonthlyGrowth = absoluteReturn / (years * 12);

	const results = document.getElementById('cagrResults');
	results.innerHTML = `
		<div class="results-header">
			<span class="results-title">📊 Calculation Results</span>
		</div>
		<div class="result-item"><span class="result-label">CAGR:</span><span class="result-value highlight">${formatPercent(cagr)}</span></div>
		<div class="result-item"><span class="result-label">Total Return:</span><span class="result-value">${formatPercent(totalReturn)}</span></div>
		<div class="result-item"><span class="result-label">Absolute Return:</span><span class="result-value text-success">${formatCurrency(absoluteReturn)}</span></div>
		<div class="result-item"><span class="result-label">Avg. Monthly Growth:</span><span class="result-value">${formatCurrency(avgMonthlyGrowth)}</span></div>
		<div class="result-item"><span class="result-label">Beginning Value:</span><span class="result-value">${formatCurrency(initial)}</span></div>
		<div class="result-item"><span class="result-label">Ending Value:</span><span class="result-value">${formatCurrency(final)}</span></div>
	`;
	results.classList.add('show');

	// Generate data for both views
	const yearlyLabels = [];
	const yearlyGrowth = [];
	const yearlyActual = [];
	const monthlyLabels = [];
	const monthlyGrowth = [];
	const totalMonths = Math.ceil(years * 12);
	const cagrDecimal = cagr / 100;
	
	for (let month = 0; month <= totalMonths; month++) {
		const timeInYears = month / 12;
		monthlyLabels.push(`Month ${month}`);
		monthlyGrowth.push(initial * Math.pow(1 + cagrDecimal, timeInYears));
		
		if (month % 12 === 0) {
			const year = month / 12;
			yearlyLabels.push(`Year ${year}`);
			yearlyGrowth.push(initial * Math.pow(1 + cagrDecimal, year));
			if (year === 0) yearlyActual.push(initial);
			else if (year === years) yearlyActual.push(final);
			else yearlyActual.push(null);
		}
	}

	chartData.cagr = {
		yearly: { labels: yearlyLabels, growth: yearlyGrowth, actual: yearlyActual },
		monthly: { labels: monthlyLabels, growth: monthlyGrowth }
	};
	
	currentChartView.cagr = currentChartView.cagr || 'yearly';
	renderCagrChart(currentChartView.cagr);
}

function renderCagrChart(view) {
	const data = chartData.cagr;
	if (!data) return;
	
	const viewData = data[view];
	const colors = getChartColors();

	const datasets = [{
		label: 'CAGR Growth Path',
		data: viewData.growth,
		borderColor: '#667eea',
		backgroundColor: 'rgba(102, 126, 234, 0.1)',
		fill: true,
		tension: 0.4,
		borderWidth: 3,
		pointRadius: view === 'yearly' ? 4 : 0,
	}];
	
	if (view === 'yearly' && viewData.actual) {
		datasets.push({
			label: 'Actual Values',
			data: viewData.actual,
			borderColor: '#f59e0b',
			backgroundColor: '#f59e0b',
			pointRadius: 8,
			pointHoverRadius: 10,
			showLine: false,
		});
	}

	if (charts.cagr) charts.cagr.destroy();
	const ctx = document.getElementById('cagrChart').getContext('2d');
	charts.cagr = new Chart(ctx, {
		type: 'line',
		data: { labels: viewData.labels, datasets },
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { position: 'bottom', labels: { color: colors.textColor, padding: 15, usePointStyle: true } },
				tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` } }
			},
			scales: {
				x: { ticks: { color: colors.textColor, maxTicksLimit: 12 }, grid: { color: colors.gridColor } },
				y: { ticks: { color: colors.textColor, callback: (v) => formatCompact(v) }, grid: { color: colors.gridColor } },
			},
		},
	});
}

function mathInput(value) {
	mathExpression += value;
	document.getElementById('mathExpression').textContent = mathExpression;
}

function mathClear() {
	mathExpression = '';
	document.getElementById('mathExpression').textContent = '';
	document.getElementById('mathResult').textContent = '0';
}

function mathBackspace() {
	mathExpression = mathExpression.slice(0, -1);
	document.getElementById('mathExpression').textContent = mathExpression;
}

function mathSqrt() {
	try {
		const result = Math.sqrt(eval(mathExpression));
		document.getElementById('mathResult').textContent = result;
		addToMathHistory(`√(${mathExpression}) = ${result}`);
		mathExpression = result.toString();
	} catch (e) {
		document.getElementById('mathResult').textContent = 'Error';
	}
}

function mathPower() {
	mathExpression += '**2';
	document.getElementById('mathExpression').textContent = mathExpression + '²';
}

function mathCalculate() {
	try {
		const result = eval(mathExpression);
		document.getElementById('mathResult').textContent = result;
		addToMathHistory(`${mathExpression} = ${result}`);
		mathExpression = result.toString();
		document.getElementById('mathExpression').textContent = '';
	} catch (e) {
		document.getElementById('mathResult').textContent = 'Error';
	}
}

function addToMathHistory(entry) {
	mathHistoryArr.unshift(entry);
	if (mathHistoryArr.length > 10) mathHistoryArr.pop();
	document.getElementById('mathHistory').innerHTML = mathHistoryArr
		.map(h => `<div style="padding: 5px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">${h}</div>`)
		.join('');
}

document.addEventListener('keydown', function (e) {
	const activeCalc = document.querySelector('.calculator.active');
	if (activeCalc && activeCalc.id === 'math') {
		if (/[0-9+\-*/.()]/.test(e.key)) {
			mathInput(e.key);
			e.preventDefault();
		} else if (e.key === 'Enter') {
			mathCalculate();
			e.preventDefault();
		} else if (e.key === 'Backspace') {
			mathBackspace();
			e.preventDefault();
		} else if (e.key === 'Escape') {
			mathClear();
			e.preventDefault();
		}
	}
});

function calculateLoan() {
	const p = parseFloat(document.getElementById('loanAmount').value) || 0;
	const annualRate = parseFloat(document.getElementById('loanRate').value) || 0;
	const years = parseFloat(document.getElementById('loanTerm').value) || 0;
	
	if (p <= 0 || annualRate <= 0 || years <= 0) {
		alert('Please enter valid positive values');
		return;
	}

	const r = annualRate / 100 / 12;
	const n = years * 12;
	const monthly = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
	const total = monthly * n;
	const interest = total - p;
	const interestPercent = (interest / total) * 100;

	const results = document.getElementById('loanResults');
	results.innerHTML = `
		<div class="results-header">
			<span class="results-title">📊 Loan Breakdown</span>
		</div>
		<div class="result-item"><span class="result-label">Monthly Payment:</span><span class="result-value highlight">${formatCurrency(monthly)}</span></div>
		<div class="result-item"><span class="result-label">Total Payment:</span><span class="result-value">${formatCurrency(total)}</span></div>
		<div class="result-item"><span class="result-label">Total Interest:</span><span class="result-value text-warning">${formatCurrency(interest)} (${interestPercent.toFixed(1)}%)</span></div>
		<div class="result-item"><span class="result-label">Principal:</span><span class="result-value">${formatCurrency(p)}</span></div>
		<div class="result-item"><span class="result-label">Yearly Payment:</span><span class="result-value">${formatCurrency(monthly * 12)}</span></div>
	`;
	results.classList.add('show');

	// Generate amortization data
	const yearlyLabels = [];
	const yearlyPrincipal = [];
	const yearlyInterest = [];
	const monthlyLabels = [];
	const monthlyPrincipal = [];
	const monthlyInterest = [];
	
	let balance = p;
	let yearPrincipal = 0, yearInterest = 0;
	
	for (let month = 1; month <= n; month++) {
		const interestPayment = balance * r;
		const principalPayment = monthly - interestPayment;
		balance -= principalPayment;
		
		monthlyLabels.push(`Month ${month}`);
		monthlyPrincipal.push(principalPayment);
		monthlyInterest.push(interestPayment);
		
		yearPrincipal += principalPayment;
		yearInterest += interestPayment;
		
		if (month % 12 === 0 || month === n) {
			yearlyLabels.push(`Year ${Math.ceil(month / 12)}`);
			yearlyPrincipal.push(yearPrincipal);
			yearlyInterest.push(yearInterest);
			yearPrincipal = 0;
			yearInterest = 0;
		}
	}

	chartData.loan = {
		yearly: { labels: yearlyLabels, principal: yearlyPrincipal, interest: yearlyInterest },
		monthly: { labels: monthlyLabels, principal: monthlyPrincipal, interest: monthlyInterest },
		summary: { principal: p, interest: interest }
	};
	
	currentChartView.loan = currentChartView.loan || 'yearly';
	renderLoanChart(currentChartView.loan);
}

function renderLoanChart(view) {
	const data = chartData.loan;
	if (!data) return;
	
	const colors = getChartColors();

	if (charts.loan) charts.loan.destroy();
	const ctx = document.getElementById('loanChart').getContext('2d');
	
	if (view === 'yearly' || view === 'monthly') {
		const viewData = data[view];
		charts.loan = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: viewData.labels,
				datasets: [
					{ label: 'Principal', data: viewData.principal, backgroundColor: '#667eea', borderRadius: 4 },
					{ label: 'Interest', data: viewData.interest, backgroundColor: '#f59e0b', borderRadius: 4 },
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { position: 'bottom', labels: { color: colors.textColor, padding: 15, usePointStyle: true } },
					tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` } }
				},
				scales: {
					x: { stacked: true, ticks: { color: colors.textColor, maxTicksLimit: 12 }, grid: { color: colors.gridColor } },
					y: { stacked: true, ticks: { color: colors.textColor, callback: (v) => formatCompact(v) }, grid: { color: colors.gridColor } },
				},
			},
		});
	} else {
		// Summary doughnut view
		charts.loan = new Chart(ctx, {
			type: 'doughnut',
			data: {
				labels: ['Principal', 'Interest'],
				datasets: [{ data: [data.summary.principal, data.summary.interest], backgroundColor: ['#667eea', '#f59e0b'], borderWidth: 0 }],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { position: 'bottom', labels: { color: colors.textColor, padding: 20 } },
					tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.raw)}` } }
				},
			},
		});
	}
}

function calculateMortgage() {
	const homePrice = parseFloat(document.getElementById('homePrice').value) || 0;
	const downPayment = parseFloat(document.getElementById('downPayment').value) || 0;
	const years = parseFloat(document.getElementById('mortgageTerm').value) || 0;
	const annualRate = parseFloat(document.getElementById('mortgageRate').value) || 0;
	const tax = parseFloat(document.getElementById('propertyTax').value) || 0;
	const insurance = parseFloat(document.getElementById('homeInsurance').value) || 0;
	
	if (homePrice <= 0 || years <= 0 || homePrice <= downPayment) {
		alert('Please enter valid values. Home price must be greater than down payment.');
		return;
	}

	const p = homePrice - downPayment;
	const r = annualRate / 100 / 12;
	const n = years * 12;
	const monthlyTax = tax / 12;
	const monthlyInsurance = insurance / 12;

	const pAndI = r > 0 ? (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : p / n;
	const totalMonthly = pAndI + monthlyTax + monthlyInsurance;
	const totalPayments = totalMonthly * n;
	const totalInterest = (pAndI * n) - p;
	const downPaymentPercent = ((downPayment / homePrice) * 100).toFixed(1);

	const results = document.getElementById('mortgageResults');
	results.innerHTML = `
		<div class="results-header">
			<span class="results-title">🏠 Monthly Payment Breakdown</span>
		</div>
		<div class="result-item"><span class="result-label">Total Monthly Payment:</span><span class="result-value highlight">${formatCurrency(totalMonthly)}</span></div>
		<div class="result-item"><span class="result-label">Principal & Interest:</span><span class="result-value">${formatCurrency(pAndI)}</span></div>
		<div class="result-item"><span class="result-label">Property Tax (monthly):</span><span class="result-value">${formatCurrency(monthlyTax)}</span></div>
		<div class="result-item"><span class="result-label">Home Insurance (monthly):</span><span class="result-value">${formatCurrency(monthlyInsurance)}</span></div>
		<div class="result-item"><span class="result-label">Down Payment:</span><span class="result-value">${formatCurrency(downPayment)} (${downPaymentPercent}%)</span></div>
		<div class="result-item"><span class="result-label">Loan Amount:</span><span class="result-value">${formatCurrency(p)}</span></div>
		<div class="result-item"><span class="result-label">Total Interest:</span><span class="result-value text-warning">${formatCurrency(totalInterest)}</span></div>
	`;
	results.classList.add('show');

	// Generate balance data
	const yearlyLabels = [];
	const yearlyBalance = [];
	const yearlyPrincipalPaid = [];
	const monthlyLabels = [];
	const monthlyBalance = [];
	
	let balance = p;
	let principalPaidTotal = 0;
	
	for (let month = 0; month <= n; month++) {
		monthlyLabels.push(`Month ${month}`);
		monthlyBalance.push(balance);
		
		if (month % 12 === 0) {
			yearlyLabels.push(`Year ${month / 12}`);
			yearlyBalance.push(balance);
			yearlyPrincipalPaid.push(principalPaidTotal);
		}
		
		if (month < n && r > 0) {
			const interestPayment = balance * r;
			const principalPayment = pAndI - interestPayment;
			balance = Math.max(0, balance - principalPayment);
			principalPaidTotal += principalPayment;
		}
	}

	chartData.mortgage = {
		yearly: { labels: yearlyLabels, balance: yearlyBalance, principalPaid: yearlyPrincipalPaid },
		monthly: { labels: monthlyLabels, balance: monthlyBalance },
		summary: { pAndI, monthlyTax, monthlyInsurance }
	};
	
	currentChartView.mortgage = currentChartView.mortgage || 'yearly';
	renderMortgageChart(currentChartView.mortgage);
}

function renderMortgageChart(view) {
	const data = chartData.mortgage;
	if (!data) return;
	
	const colors = getChartColors();

	if (charts.mortgage) charts.mortgage.destroy();
	const ctx = document.getElementById('mortgageChart').getContext('2d');
	
	if (view === 'yearly' || view === 'monthly') {
		const viewData = data[view];
		charts.mortgage = new Chart(ctx, {
			type: 'line',
			data: {
				labels: viewData.labels,
				datasets: [{
					label: 'Remaining Balance',
					data: viewData.balance,
					borderColor: '#667eea',
					backgroundColor: 'rgba(102, 126, 234, 0.1)',
					fill: true,
					tension: 0.4,
					borderWidth: 3,
					pointRadius: view === 'yearly' ? 4 : 0,
				}],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { position: 'bottom', labels: { color: colors.textColor, padding: 15, usePointStyle: true } },
					tooltip: { callbacks: { label: (ctx) => `Balance: ${formatCurrency(ctx.raw)}` } }
				},
				scales: {
					x: { ticks: { color: colors.textColor, maxTicksLimit: 12 }, grid: { color: colors.gridColor } },
					y: { ticks: { color: colors.textColor, callback: (v) => formatCompact(v) }, grid: { color: colors.gridColor } },
				},
			},
		});
	} else {
		// Summary pie view
		charts.mortgage = new Chart(ctx, {
			type: 'pie',
			data: {
				labels: ['Principal & Interest', 'Property Tax', 'Insurance'],
				datasets: [{ data: [data.summary.pAndI, data.summary.monthlyTax, data.summary.monthlyInsurance], backgroundColor: ['#667eea', '#10b981', '#f59e0b'], borderWidth: 0 }],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { position: 'bottom', labels: { color: colors.textColor, padding: 20 } },
					tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.raw)}/mo` } }
				},
			},
		});
	}
}

function calculateInvestment() {
	const initial = parseFloat(document.getElementById('initialInvestment').value) || 0;
	const monthly = parseFloat(document.getElementById('monthlyContribution').value) || 0;
	const rate = parseFloat(document.getElementById('investmentReturn').value) || 0;
	const years = parseFloat(document.getElementById('investmentYears').value) || 0;

	if (years <= 0) {
		alert('Please enter valid positive values');
		return;
	}

	const r = rate / 100;
	let balance = initial;
	const yearlyLabels = [];
	const yearlyValue = [];
	const yearlyContributions = [];
	const monthlyLabels = [];
	const monthlyValue = [];
	const monthlyContributionsData = [];
	const totalMonths = years * 12;

	for (let month = 0; month <= totalMonths; month++) {
		monthlyLabels.push(`Month ${month}`);
		monthlyValue.push(balance);
		monthlyContributionsData.push(initial + monthly * month);
		
		if (month % 12 === 0) {
			const year = month / 12;
			yearlyLabels.push(`Year ${year}`);
			yearlyValue.push(balance);
			yearlyContributions.push(initial + monthly * month);
		}
		
		if (month < totalMonths) {
			balance = balance * (1 + r / 12) + monthly;
		}
	}

	const totalContributions = initial + monthly * totalMonths;
	const earnings = balance - totalContributions;
	const roi = totalContributions > 0 ? (earnings / totalContributions) * 100 : 0;

	const results = document.getElementById('investmentResults');
	results.innerHTML = `
		<div class="results-header">
			<span class="results-title">💼 Investment Projection</span>
		</div>
		<div class="result-item"><span class="result-label">Final Balance:</span><span class="result-value highlight">${formatCurrency(balance)}</span></div>
		<div class="result-item"><span class="result-label">Total Contributions:</span><span class="result-value">${formatCurrency(totalContributions)}</span></div>
		<div class="result-item"><span class="result-label">Total Earnings:</span><span class="result-value text-success">${formatCurrency(earnings)}</span></div>
		<div class="result-item"><span class="result-label">Return on Investment:</span><span class="result-value">${formatPercent(roi)}</span></div>
		<div class="result-item"><span class="result-label">Monthly Contribution:</span><span class="result-value">${formatCurrency(monthly)}</span></div>
	`;
	results.classList.add('show');

	chartData.investment = {
		yearly: { labels: yearlyLabels, value: yearlyValue, contributions: yearlyContributions },
		monthly: { labels: monthlyLabels, value: monthlyValue, contributions: monthlyContributionsData }
	};
	
	currentChartView.investment = currentChartView.investment || 'yearly';
	renderInvestmentChart(currentChartView.investment);
}

function renderInvestmentChart(view) {
	const data = chartData.investment;
	if (!data) return;
	
	const viewData = data[view];
	const colors = getChartColors();

	if (charts.investment) charts.investment.destroy();
	const ctx = document.getElementById('investmentChart').getContext('2d');
	charts.investment = new Chart(ctx, {
		type: 'line',
		data: {
			labels: viewData.labels,
			datasets: [
				{ 
					label: 'Investment Value', 
					data: viewData.value, 
					borderColor: '#667eea', 
					backgroundColor: 'rgba(102, 126, 234, 0.1)', 
					fill: true, 
					tension: 0.4,
					borderWidth: 3,
					pointRadius: view === 'yearly' ? 4 : 0,
				},
				{ 
					label: 'Total Contributions', 
					data: viewData.contributions, 
					borderColor: '#10b981', 
					backgroundColor: 'rgba(16, 185, 129, 0.1)', 
					fill: true, 
					tension: 0.4,
					borderWidth: 2,
					pointRadius: view === 'yearly' ? 3 : 0,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: { position: 'bottom', labels: { color: colors.textColor, padding: 15, usePointStyle: true } },
				tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` } }
			},
			scales: {
				x: { ticks: { color: colors.textColor, maxTicksLimit: 12 }, grid: { color: colors.gridColor } },
				y: { ticks: { color: colors.textColor, callback: (v) => formatCompact(v) }, grid: { color: colors.gridColor } },
			},
		},
	});
}

function calculateRetirement() {
	const currentAge = parseFloat(document.getElementById('currentAge').value) || 0;
	const retirementAge = parseFloat(document.getElementById('retirementAge').value) || 0;
	const current = parseFloat(document.getElementById('currentSavings').value) || 0;
	const monthly = parseFloat(document.getElementById('monthlyRetirementSaving').value) || 0;
	const rate = parseFloat(document.getElementById('retirementReturn').value) || 0;
	
	if (retirementAge <= currentAge) {
		alert('Retirement age must be greater than current age');
		return;
	}

	const years = retirementAge - currentAge;
	const r = rate / 100;
	const totalMonths = years * 12;
	
	let balance = current;
	const yearlyLabels = [];
	const yearlyBalance = [];
	const yearlyContributions = [];
	const monthlyLabels = [];
	const monthlyBalance = [];

	for (let month = 0; month <= totalMonths; month++) {
		monthlyLabels.push(`Month ${month}`);
		monthlyBalance.push(balance);
		
		if (month % 12 === 0) {
			const age = currentAge + month / 12;
			yearlyLabels.push(`Age ${age}`);
			yearlyBalance.push(balance);
			yearlyContributions.push(current + monthly * month);
		}
		
		if (month < totalMonths) {
			balance = balance * (1 + r / 12) + monthly;
		}
	}

	const totalContributions = current + monthly * totalMonths;
	const earnings = balance - totalContributions;
	const monthlyRetirementIncome = (balance * 0.04) / 12;
	const yearlyRetirementIncome = balance * 0.04;

	const results = document.getElementById('retirementResults');
	results.innerHTML = `
		<div class="results-header">
			<span class="results-title">🎯 Retirement Projection</span>
		</div>
		<div class="result-item"><span class="result-label">Retirement Savings at ${retirementAge}:</span><span class="result-value highlight">${formatCurrency(balance)}</span></div>
		<div class="result-item"><span class="result-label">Total Contributions:</span><span class="result-value">${formatCurrency(totalContributions)}</span></div>
		<div class="result-item"><span class="result-label">Investment Earnings:</span><span class="result-value text-success">${formatCurrency(earnings)}</span></div>
		<div class="result-item"><span class="result-label">Est. Monthly Income (4% rule):</span><span class="result-value text-cyan">${formatCurrency(monthlyRetirementIncome)}</span></div>
		<div class="result-item"><span class="result-label">Est. Yearly Income (4% rule):</span><span class="result-value">${formatCurrency(yearlyRetirementIncome)}</span></div>
		<div class="result-item"><span class="result-label">Years to Retirement:</span><span class="result-value">${years} years</span></div>
	`;
	results.classList.add('show');

	chartData.retirement = {
		yearly: { labels: yearlyLabels, balance: yearlyBalance, contributions: yearlyContributions },
		monthly: { labels: monthlyLabels, balance: monthlyBalance },
		summary: { contributions: totalContributions, earnings: earnings, total: balance }
	};
	
	currentChartView.retirement = currentChartView.retirement || 'yearly';
	renderRetirementChart(currentChartView.retirement);
}

function renderRetirementChart(view) {
	const data = chartData.retirement;
	if (!data) return;
	
	const colors = getChartColors();

	if (charts.retirement) charts.retirement.destroy();
	const ctx = document.getElementById('retirementChart').getContext('2d');
	
	if (view === 'yearly' || view === 'monthly') {
		const viewData = data[view];
		const datasets = [{
			label: 'Portfolio Balance',
			data: viewData.balance,
			borderColor: '#667eea',
			backgroundColor: 'rgba(102, 126, 234, 0.1)',
			fill: true,
			tension: 0.4,
			borderWidth: 3,
			pointRadius: view === 'yearly' ? 4 : 0,
		}];
		
		if (view === 'yearly') {
			datasets.push({
				label: 'Total Contributions',
				data: viewData.contributions,
				borderColor: '#10b981',
				backgroundColor: 'rgba(16, 185, 129, 0.1)',
				fill: true,
				tension: 0.4,
				borderWidth: 2,
				pointRadius: 3,
			});
		}
		
		charts.retirement = new Chart(ctx, {
			type: 'line',
			data: { labels: viewData.labels, datasets },
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { position: 'bottom', labels: { color: colors.textColor, padding: 15, usePointStyle: true } },
					tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` } }
				},
				scales: {
					x: { ticks: { color: colors.textColor, maxTicksLimit: 12 }, grid: { color: colors.gridColor } },
					y: { ticks: { color: colors.textColor, callback: (v) => formatCompact(v) }, grid: { color: colors.gridColor } },
				},
			},
		});
	} else {
		// Summary bar view
		charts.retirement = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: ['Contributions', 'Earnings', 'Total'],
				datasets: [{
					label: 'Amount ($)',
					data: [data.summary.contributions, data.summary.earnings, data.summary.total],
					backgroundColor: ['#667eea', '#10b981', '#f59e0b'],
					borderWidth: 0,
					borderRadius: 8,
				}],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: { legend: { display: false } },
				scales: {
					x: { ticks: { color: colors.textColor }, grid: { color: colors.gridColor } },
					y: { ticks: { color: colors.textColor, callback: (v) => formatCompact(v) }, grid: { color: colors.gridColor } },
				},
			},
		});
	}
}

function calculateSavings() {
	const goal = parseFloat(document.getElementById('savingsGoal').value) || 0;
	const current = parseFloat(document.getElementById('currentSavingsAmount').value) || 0;
	const years = parseFloat(document.getElementById('savingsYears').value) || 0;
	const rate = parseFloat(document.getElementById('savingsRate').value) || 0;

	if (goal <= 0 || years <= 0 || goal <= current) {
		alert('Please enter valid values. Goal must be greater than current savings.');
		return;
	}

	const needed = goal - current;
	const months = years * 12;
	const r = rate / 100;
	const monthlyRate = r / 12;

	// Calculate monthly savings needed using annuity formula
	let monthlyNeeded;
	if (monthlyRate > 0) {
		const fvFactor = Math.pow(1 + monthlyRate, months);
		const currentFV = current * fvFactor;
		const goalAfterCurrent = goal - currentFV;
		monthlyNeeded = (goalAfterCurrent * monthlyRate) / (fvFactor - 1);
		monthlyNeeded = Math.max(0, monthlyNeeded);
	} else {
		monthlyNeeded = needed / months;
	}

	const totalSaved = monthlyNeeded * months;
	const interestEarned = goal - current - totalSaved;

	const results = document.getElementById('savingsResults');
	results.innerHTML = `
		<div class="results-header">
			<span class="results-title">🎯 Savings Plan</span>
		</div>
		<div class="result-item"><span class="result-label">Monthly Savings Needed:</span><span class="result-value highlight">${formatCurrency(monthlyNeeded)}</span></div>
		<div class="result-item"><span class="result-label">Weekly Savings:</span><span class="result-value">${formatCurrency(monthlyNeeded / 4.33)}</span></div>
		<div class="result-item"><span class="result-label">Daily Savings:</span><span class="result-value">${formatCurrency(monthlyNeeded / 30)}</span></div>
		<div class="result-item"><span class="result-label">Est. Interest Earned:</span><span class="result-value text-success">${formatCurrency(Math.max(0, interestEarned))}</span></div>
		<div class="result-item"><span class="result-label">Amount to Save:</span><span class="result-value">${formatCurrency(needed)}</span></div>
		<div class="result-item"><span class="result-label">Savings Goal:</span><span class="result-value">${formatCurrency(goal)}</span></div>
	`;
	results.classList.add('show');

	// Generate savings progression data
	const yearlyLabels = [];
	const yearlySaved = [];
	const yearlyProgress = [];
	const monthlyLabels = [];
	const monthlySaved = [];
	
	let balance = current;
	
	for (let month = 0; month <= months; month++) {
		monthlyLabels.push(`Month ${month}`);
		monthlySaved.push(balance);
		
		if (month % 12 === 0) {
			yearlyLabels.push(`Year ${month / 12}`);
			yearlySaved.push(balance);
			yearlyProgress.push((balance / goal) * 100);
		}
		
		if (month < months) {
			balance = balance * (1 + monthlyRate) + monthlyNeeded;
		}
	}

	chartData.savings = {
		yearly: { labels: yearlyLabels, saved: yearlySaved, progress: yearlyProgress },
		monthly: { labels: monthlyLabels, saved: monthlySaved },
		summary: { current, needed, goal }
	};
	
	currentChartView.savings = currentChartView.savings || 'yearly';
	renderSavingsChart(currentChartView.savings);
}

function renderSavingsChart(view) {
	const data = chartData.savings;
	if (!data) return;
	
	const colors = getChartColors();

	if (charts.savings) charts.savings.destroy();
	const ctx = document.getElementById('savingsChart').getContext('2d');
	
	if (view === 'yearly' || view === 'monthly') {
		const viewData = data[view];
		charts.savings = new Chart(ctx, {
			type: 'line',
			data: {
				labels: viewData.labels,
				datasets: [{
					label: 'Savings Balance',
					data: viewData.saved,
					borderColor: '#667eea',
					backgroundColor: 'rgba(102, 126, 234, 0.1)',
					fill: true,
					tension: 0.4,
					borderWidth: 3,
					pointRadius: view === 'yearly' ? 4 : 0,
				}, {
					label: 'Goal',
					data: viewData.saved.map(() => data.summary.goal),
					borderColor: '#f59e0b',
					borderDash: [5, 5],
					borderWidth: 2,
					pointRadius: 0,
					fill: false,
				}],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { position: 'bottom', labels: { color: colors.textColor, padding: 15, usePointStyle: true } },
					tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` } }
				},
				scales: {
					x: { ticks: { color: colors.textColor, maxTicksLimit: 12 }, grid: { color: colors.gridColor } },
					y: { ticks: { color: colors.textColor, callback: (v) => formatCompact(v) }, grid: { color: colors.gridColor } },
				},
			},
		});
	} else {
		// Summary doughnut view
		charts.savings = new Chart(ctx, {
			type: 'doughnut',
			data: {
				labels: ['Current Savings', 'Amount to Save'],
				datasets: [{ data: [data.summary.current, data.summary.needed], backgroundColor: ['#10b981', '#667eea'], borderWidth: 0 }],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { position: 'bottom', labels: { color: colors.textColor, padding: 20 } },
					tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.raw)}` } }
				},
			},
		});
	}
}

function calculateROI() {
	const initial = parseFloat(document.getElementById('initialCost').value) || 0;
	const final = parseFloat(document.getElementById('finalValue').value) || 0;
	const years = parseFloat(document.getElementById('roiYears').value) || 0;

	if (initial <= 0 || years <= 0) {
		alert('Please enter valid positive values');
		return;
	}

	const totalReturn = final - initial;
	const roi = (totalReturn / initial) * 100;
	const annualizedROI = (Math.pow(final / initial, 1 / years) - 1) * 100;
	const avgYearlyReturn = totalReturn / years;
	const avgMonthlyReturn = totalReturn / (years * 12);
	const isProfit = totalReturn >= 0;

	const results = document.getElementById('roiResults');
	results.innerHTML = `
		<div class="results-header">
			<span class="results-title">📉 ROI Analysis</span>
		</div>
		<div class="result-item"><span class="result-label">Total Return:</span><span class="result-value ${isProfit ? 'text-success' : 'text-danger'}">${formatCurrency(totalReturn)}</span></div>
		<div class="result-item"><span class="result-label">ROI Percentage:</span><span class="result-value highlight">${roi.toFixed(2)}%</span></div>
		<div class="result-item"><span class="result-label">Annualized ROI (CAGR):</span><span class="result-value">${annualizedROI.toFixed(2)}%</span></div>
		<div class="result-item"><span class="result-label">Avg. Yearly Return:</span><span class="result-value">${formatCurrency(avgYearlyReturn)}</span></div>
		<div class="result-item"><span class="result-label">Avg. Monthly Return:</span><span class="result-value">${formatCurrency(avgMonthlyReturn)}</span></div>
		<div class="result-item"><span class="result-label">Initial Investment:</span><span class="result-value">${formatCurrency(initial)}</span></div>
		<div class="result-item"><span class="result-label">Final Value:</span><span class="result-value">${formatCurrency(final)}</span></div>
	`;
	results.classList.add('show');

	// Generate growth path data
	const yearlyLabels = [];
	const yearlyValue = [];
	const monthlyLabels = [];
	const monthlyValue = [];
	const totalMonths = Math.ceil(years * 12);
	const cagrDecimal = annualizedROI / 100;
	
	for (let month = 0; month <= totalMonths; month++) {
		const timeInYears = month / 12;
		monthlyLabels.push(`Month ${month}`);
		monthlyValue.push(initial * Math.pow(1 + cagrDecimal, timeInYears));
		
		if (month % 12 === 0) {
			yearlyLabels.push(`Year ${month / 12}`);
			yearlyValue.push(initial * Math.pow(1 + cagrDecimal, month / 12));
		}
	}

	chartData.roi = {
		yearly: { labels: yearlyLabels, value: yearlyValue },
		monthly: { labels: monthlyLabels, value: monthlyValue },
		summary: { initial, final, totalReturn, isProfit }
	};
	
	currentChartView.roi = currentChartView.roi || 'yearly';
	renderRoiChart(currentChartView.roi);
}

function renderRoiChart(view) {
	const data = chartData.roi;
	if (!data) return;
	
	const colors = getChartColors();

	if (charts.roi) charts.roi.destroy();
	const ctx = document.getElementById('roiChart').getContext('2d');
	
	if (view === 'yearly' || view === 'monthly') {
		const viewData = data[view];
		charts.roi = new Chart(ctx, {
			type: 'line',
			data: {
				labels: viewData.labels,
				datasets: [{
					label: 'Value Over Time',
					data: viewData.value,
					borderColor: data.summary.isProfit ? '#10b981' : '#ef4444',
					backgroundColor: data.summary.isProfit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
					fill: true,
					tension: 0.4,
					borderWidth: 3,
					pointRadius: view === 'yearly' ? 4 : 0,
				}],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { position: 'bottom', labels: { color: colors.textColor, padding: 15, usePointStyle: true } },
					tooltip: { callbacks: { label: (ctx) => `Value: ${formatCurrency(ctx.raw)}` } }
				},
				scales: {
					x: { ticks: { color: colors.textColor, maxTicksLimit: 12 }, grid: { color: colors.gridColor } },
					y: { ticks: { color: colors.textColor, callback: (v) => formatCompact(v) }, grid: { color: colors.gridColor } },
				},
			},
		});
	} else {
		// Summary bar view
		charts.roi = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: ['Initial Investment', 'Final Value', 'Total Return'],
				datasets: [{
					label: 'Amount ($)',
					data: [data.summary.initial, data.summary.final, data.summary.totalReturn],
					backgroundColor: ['#667eea', '#f59e0b', data.summary.isProfit ? '#10b981' : '#ef4444'],
					borderWidth: 0,
					borderRadius: 8,
				}],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: { legend: { display: false } },
				scales: {
					x: { ticks: { color: colors.textColor }, grid: { color: colors.gridColor } },
					y: { ticks: { color: colors.textColor, callback: (v) => formatCompact(v) }, grid: { color: colors.gridColor } },
				},
			},
		});
	}
}

// Theme toggle logic with chart refresh
window.addEventListener('DOMContentLoaded', () => {
	const themeToggle = document.getElementById('themeToggle');
	if (!themeToggle) return;

	function refreshAllCharts() {
		// Refresh charts with new theme colors
		Object.keys(chartData).forEach(calcId => {
			const renderFn = {
				compound: renderChart,
				simple: renderSimpleChart,
				cagr: renderCagrChart,
				loan: renderLoanChart,
				mortgage: renderMortgageChart,
				investment: renderInvestmentChart,
				retirement: renderRetirementChart,
				savings: renderSavingsChart,
				roi: renderRoiChart
			}[calcId];
			if (renderFn && currentChartView[calcId]) {
				try {
					if (calcId === 'compound') {
						renderFn('compound', currentChartView[calcId]);
					} else {
						renderFn(currentChartView[calcId]);
					}
				} catch (e) {
					console.log('Chart refresh skipped:', calcId);
				}
			}
		});
	}

	function setTheme(mode) {
		if (mode === 'light') {
			document.body.classList.add('light-mode');
			themeToggle.textContent = '☀️ Light Mode';
		} else {
			document.body.classList.remove('light-mode');
			themeToggle.textContent = '🌙 Dark Mode';
		}
		localStorage.setItem('theme', mode);
		// Refresh charts after theme change
		setTimeout(refreshAllCharts, 100);
	}

	themeToggle.addEventListener('click', () => {
		const isLight = document.body.classList.contains('light-mode');
		setTheme(isLight ? 'dark' : 'light');
	});

	const savedTheme = localStorage.getItem('theme');
	if (savedTheme) {
		setTheme(savedTheme);
	} else {
		// Default to light mode if no preference is set
		setTheme('light');
	}
});
