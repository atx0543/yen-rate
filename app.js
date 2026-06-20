// Mock Historical Data Generator
function generateMockData(count, base, volatility, type = 'day') {
  const data = [];
  const labels = [];
  let currentVal = base;
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    let date;
    if (type === 'hour') {
      date = new Date(now.getTime() - i * 60 * 60 * 1000);
      labels.push(`${date.getHours()}:00`);
    } else if (type === 'day') {
      date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      if (count <= 7) {
        const days = ['日', '月', '火', '水', '木', '金', '土'];
        labels.push(days[date.getDay()] + '曜');
      } else {
        labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
      }
    } else if (type === 'month') {
      date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(`${date.getFullYear()}/${date.getMonth() + 1}`);
    } else if (type === 'month_long') {
      date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      if (date.getMonth() === 0 || i === 0 || i === count - 1) {
        labels.push(`${date.getFullYear()}年`);
      } else {
        labels.push(`${date.getMonth() + 1}月`);
      }
    } else if (type === 'year') {
      date = new Date(now.getFullYear() - i, 0, 1);
      labels.push(`${date.getFullYear()}年`);
    }

    // Generate trend (upward base growth for long-term JPY weakening)
    if (type === 'month_long' || type === 'year') {
      const progress = (count - i) / count;
      const targetBase = 156.45;
      const expectedValue = base + (targetBase - base) * progress;
      const randomOffset = (Math.random() - 0.5) * volatility;
      currentVal = parseFloat((expectedValue + randomOffset).toFixed(2));
    } else {
      const change = (Math.random() - 0.48) * volatility;
      currentVal = parseFloat((currentVal + change).toFixed(2));
    }
    
    data.push(currentVal);
  }
  return { labels, data };
}

// Data Stores for Chart
const chartDataSets = {
  '1d': generateMockData(24, 156.45, 0.25, 'hour'),
  '1w': generateMockData(7, 155.80, 0.90, 'day'),
  '1m': generateMockData(30, 154.50, 1.50, 'day'),
  '1y': generateMockData(12, 142.00, 5.00, 'month'),
  '5y': generateMockData(60, 109.50, 6.00, 'month_long'),
  '10y': generateMockData(10, 101.20, 8.00, 'year')
};

let rateChartInstance = null;

// Initialize Chart
function initChart() {
  const ctx = document.getElementById('mainRateChart').getContext('2d');
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, 'rgba(0, 229, 255, 0.35)');
  gradient.addColorStop(1, 'rgba(138, 43, 226, 0.01)');

  const defaultData = chartDataSets['1m'];

  rateChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: defaultData.labels,
      datasets: [{
        label: 'USD/JPY',
        data: defaultData.data,
        borderColor: '#00e5ff',
        borderWidth: 3,
        pointBackgroundColor: '#00e5ff',
        pointBorderColor: 'rgba(255,255,255,0.8)',
        pointHoverRadius: 6,
        pointRadius: 2,
        fill: true,
        backgroundColor: gradient,
        tension: 0.35
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#0f0e1d',
          titleColor: '#a0aec0',
          bodyColor: '#fff',
          bodyFont: { family: 'Space Grotesk', weight: 'bold' },
          borderColor: 'rgba(0, 229, 255, 0.3)',
          borderWidth: 1,
          padding: 10,
          displayColors: false
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.03)'
          },
          ticks: {
            color: '#718096',
            font: { family: 'Outfit', size: 10 }
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            color: '#718096',
            font: { family: 'Space Grotesk', size: 11 }
          }
        }
      }
    }
  });
}

// Update Chart Data
function updateChart(period) {
  if (!rateChartInstance) return;
  
  const dataset = chartDataSets[period];
  rateChartInstance.data.labels = dataset.labels;
  rateChartInstance.data.datasets[0].data = dataset.data;
  rateChartInstance.update('active');
}

// Current rates live simulation
const currentRates = {
  usdjpy: { base: 156.45, elementId: 'val-usdjpy', changeId: 'change-usdjpy', pct: 0.24, abs: 0.38 },
  eurjpy: { base: 169.82, elementId: 'val-eurjpy', changeId: 'change-eurjpy', pct: 0.12, abs: 0.20 },
  gbpjpy: { base: 199.15, elementId: 'val-gbpjpy', changeId: 'change-gbpjpy', pct: -0.08, abs: -0.16 },
  audjpy: { base: 103.58, elementId: 'val-audjpy', changeId: 'change-audjpy', pct: 0.05, abs: 0.05 }
};

// Fetch real rates from ExchangeRate-API (free, keyless open endpoint)
async function fetchRealRates() {
  let currentRatesUpdated = false;
  try {
    // 1. Fetch current rates (base USD)
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await response.json();
    
    if (data && data.rates) {
      const rates = data.rates;
      
      const usdjpy = rates.JPY;
      const eurjpy = rates.JPY / rates.EUR;
      const gbpjpy = rates.JPY / rates.GBP;
      const audjpy = rates.JPY / rates.AUD;
      
      // Update our current rates base values
      currentRates.usdjpy.base = parseFloat(usdjpy.toFixed(2));
      currentRates.eurjpy.base = parseFloat(eurjpy.toFixed(2));
      currentRates.gbpjpy.base = parseFloat(gbpjpy.toFixed(2));
      currentRates.audjpy.base = parseFloat(audjpy.toFixed(2));
      currentRatesUpdated = true;

      // Update date in floating badge
      const dateEl = document.getElementById('floating-date');
      if (dateEl) {
        // Parse "Sun, 14 Jun 2026 00:00:00 +0000" into "14 Jun"
        const parts = data.time_last_update_utc ? data.time_last_update_utc.split(' ') : [];
        const dateStr = parts.length >= 3 ? `${parts[1]} ${parts[2]}` : '本日';
        dateEl.textContent = `(更新: ${dateStr})`;
      }
    }
  } catch (error) {
    console.error('Failed to fetch current rates:', error);
  }

  // Update UI immediately with current rates if available
  if (currentRatesUpdated) {
    updateRatesUI();
  }

  // 2. Fetch rates range from Frankfurter to calculate real change percent safely
  try {
    if (currentRatesUpdated) {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const historyResponse = await fetch(`https://api.frankfurter.app/${startDate}..${endDate}?from=USD&to=JPY,EUR,GBP,AUD`);
      const historyData = await historyResponse.json();
      
      if (historyData && historyData.rates) {
        const dates = Object.keys(historyData.rates).sort();
        if (dates.length >= 1) {
          // Yesterday or last business day from history
          const prevDate = dates[dates.length - 1];
          const prevRates = historyData.rates[prevDate];
          
          const prevUsdjpy = prevRates.JPY;
          const prevEurjpy = prevRates.JPY / prevRates.EUR;
          const prevGbpjpy = prevRates.JPY / prevRates.GBP;
          const prevAudjpy = prevRates.JPY / prevRates.AUD;
          
          currentRates.usdjpy.abs = currentRates.usdjpy.base - prevUsdjpy;
          currentRates.eurjpy.abs = currentRates.eurjpy.base - prevEurjpy;
          currentRates.gbpjpy.abs = currentRates.gbpjpy.base - prevGbpjpy;
          currentRates.audjpy.abs = currentRates.audjpy.base - prevAudjpy;
          
          currentRates.usdjpy.pct = (currentRates.usdjpy.abs / prevUsdjpy) * 100;
          currentRates.eurjpy.pct = (currentRates.eurjpy.abs / prevEurjpy) * 100;
          currentRates.gbpjpy.pct = (currentRates.gbpjpy.abs / prevGbpjpy) * 100;
          currentRates.audjpy.pct = (currentRates.audjpy.abs / prevAudjpy) * 100;
          
          updateRatesUI();
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch historical rates for comparison:', error);
  }
}

// Separate UI update function for robustness
function updateRatesUI() {
  Object.keys(currentRates).forEach(key => {
    const pair = currentRates[key];
    const valEl = document.getElementById(pair.elementId);
    const changeEl = document.getElementById(pair.changeId);
    
    if (valEl) valEl.textContent = pair.base.toFixed(2);
    if (changeEl) {
      if (pair.abs >= 0) {
        changeEl.className = 'rate-change up';
        changeEl.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> <span>+${pair.pct.toFixed(2)}% (+${pair.abs.toFixed(2)})</span>`;
      } else {
        changeEl.className = 'rate-change down';
        changeEl.innerHTML = `<i class="fa-solid fa-arrow-trend-down"></i> <span>${pair.pct.toFixed(2)}% (${pair.abs.toFixed(2)})</span>`;
      }
    }
  });

  // Also update floating badge USD/JPY
  const floatValEl = document.getElementById('floating-usdjpy');
  if (floatValEl) {
    floatValEl.textContent = currentRates.usdjpy.base.toFixed(2);
  }
}

// Fetch real history for USD/JPY chart (1m period)
async function fetchRealHistoryChart() {
  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // fetch 45 days to cover weekends
    
    const response = await fetch(`https://api.frankfurter.app/${startDate}..${endDate}?from=USD&to=JPY`);
    const data = await response.json();
    
    if (data && data.rates && Object.keys(data.rates).length > 0) {
      const dates = Object.keys(data.rates).sort();
      const labels = [];
      const values = [];
      
      // Take up to latest 30 business days
      const activeDates = dates.slice(-29); // Take 29 items, leave space for latest rate
      activeDates.forEach(dateStr => {
        const date = new Date(dateStr);
        labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
        values.push(data.rates[dateStr].JPY);
      });

      // Append latest live rate from er-api to chart if available
      if (currentRates.usdjpy.base > 100) {
        const today = new Date();
        labels.push(`${today.getMonth() + 1}/${today.getDate()}`);
        values.push(currentRates.usdjpy.base);
      }
      
      // Override 1m chart data
      chartDataSets['1m'] = { labels, data: values };
      
      // Update chart if 1m is currently active
      const activeTab = document.querySelector('.btn-tab.active');
      if (activeTab && activeTab.getAttribute('data-period') === '1m') {
        updateChart('1m');
      }
    }
  } catch (error) {
    console.error('Failed to fetch historical chart data:', error);
  }
}

function simulateLiveRates() {
  setInterval(() => {
    // Pick one pair to update randomly
    const keys = Object.keys(currentRates);
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    const pair = currentRates[randomKey];
    
    // Tiny tick change (-0.03 to +0.03 JPY) simulating live forex feed
    const delta = (Math.random() - 0.49) * 0.05;
    const oldVal = pair.base;
    pair.base = parseFloat((pair.base + delta).toFixed(2));
    
    const element = document.getElementById(pair.elementId);
    if (!element) return;
    
    element.textContent = pair.base.toFixed(2);
    
    // Sync to floating rate badge if USD/JPY updated
    if (randomKey === 'usdjpy') {
      const floatValEl = document.getElementById('floating-usdjpy');
      if (floatValEl) {
        floatValEl.textContent = pair.base.toFixed(2);
      }
    }
    
    // Flash visual feedback
    if (delta > 0) {
      element.className = 'rate-value flash-up';
      pair.abs += delta;
    } else {
      element.className = 'rate-value flash-down';
      pair.abs += delta; // delta is negative
    }
    
    // Reset class after animation
    setTimeout(() => {
      element.className = 'rate-value';
    }, 800);

    // Calculate new percentage change based on initial yesterday rate
    const initialRate = pair.base - pair.abs;
    pair.pct = (pair.abs / initialRate) * 100;
    
    const changeElement = document.getElementById(pair.changeId);
    if (changeElement) {
      if (pair.abs >= 0) {
        changeElement.className = 'rate-change up';
        changeElement.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> <span>+${pair.pct.toFixed(2)}% (+${pair.abs.toFixed(2)})</span>`;
      } else {
        changeElement.className = 'rate-change down';
        changeElement.innerHTML = `<i class="fa-solid fa-arrow-trend-down"></i> <span>${pair.pct.toFixed(2)}% (${pair.abs.toFixed(2)})</span>`;
      }
    }
  }, 3000); // Poll simulator every 3 seconds for active feel
}

// Simulator computations
function runSimulator() {
  const interestDiffEl = document.getElementById('range-interest-diff');
  const riskEl = document.getElementById('range-risk');
  const tradeEl = document.getElementById('range-trade');
  
  if (!interestDiffEl || !riskEl || !tradeEl) return;
  
  const interestDiff = parseFloat(interestDiffEl.value);
  const riskVal = parseInt(riskEl.value);
  const tradeVal = parseInt(tradeEl.value);
  
  // Labels updates
  document.getElementById('label-interest-diff').textContent = `${interestDiff.toFixed(2)} %`;
  
  const riskLabels = ['円高圧力(極端なリスクオフ)', 'やや円高(リスク警戒)', 'ニュートラル', 'やや円安(リスク選好)', '強烈な円安圧力(リスクオン)'];
  document.getElementById('label-risk').textContent = riskLabels[riskVal - 1];
  
  const tradeLabels = ['巨額の赤字(円売り強)', '中程度の赤字', '軽微な赤字', '均衡状態', '黒字傾向', '顕著な黒字(円買い)', '巨額の黒字(円安抑制)'];
  document.getElementById('label-trade').textContent = tradeLabels[tradeVal + 3];
  
  // Theoretical rate computation formula:
  // Base constant: 110.0 JPY
  // Interest impact: +7.5 JPY per 1% diff
  // Risk impact: (riskVal - 3) * 2.2 JPY
  // Trade balance impact: tradeVal * -1.8 JPY
  let predictedRate = 110.0 + (interestDiff * 8.2) + ((riskVal - 3) * 2.5) + (tradeVal * -2.0);
  
  // Add minor deterministic noise based on sliders to prevent flat numbers
  const noise = (Math.sin(interestDiff) * 0.15) + (Math.cos(riskVal) * 0.1);
  predictedRate += noise;
  
  const predictedRateStr = predictedRate.toFixed(2);
  document.getElementById('sim-predicted-rate').textContent = `${predictedRateStr} 円`;
  
  // Gauge computations (Min 110 JPY = 0% 円安圧力, Max 175 JPY = 100% 円安圧力)
  let pressurePercentage = Math.round(((predictedRate - 110) / (175 - 110)) * 100);
  pressurePercentage = Math.max(0, Math.min(100, pressurePercentage));
  
  document.getElementById('gauge-percentage').innerHTML = `${pressurePercentage}<span>円安圧力</span>`;
  
  // SVG Stroke offset
  const circleRadius = 40;
  const circumference = 2 * Math.PI * circleRadius; // ~251.2
  const offset = circumference - (pressurePercentage / 100) * circumference;
  
  const gaugeBar = document.getElementById('gauge-progress');
  if (gaugeBar) {
    gaugeBar.style.strokeDasharray = `${circumference}`;
    gaugeBar.style.strokeDashoffset = `${offset}`;
  }
  
  // Description and technical update dynamically
  const descEl = document.getElementById('sim-predicted-desc');
  const rsiValEl = document.getElementById('val-rsi');
  const rsiBadge = document.getElementById('badge-rsi');
  
  let descText = "";
  if (predictedRate > 158) {
    descText = "危険水準の円安：日本政府による為替介入警戒感が極めて高まります。";
    rsiValEl.textContent = `RSI: ${Math.min(92, Math.round(55 + (predictedRate - 150) * 3))} (買われすぎ)`;
    rsiBadge.textContent = "Overbought";
    rsiBadge.className = "indicator-badge badge-sell";
  } else if (predictedRate < 140) {
    descText = "顕著な円高基調：金利差縮小およびリスク回避傾向による円買戻しが優勢です。";
    rsiValEl.textContent = `RSI: ${Math.max(15, Math.round(45 - (145 - predictedRate) * 2.5))} (売られすぎ)`;
    rsiBadge.textContent = "Oversold";
    rsiBadge.className = "indicator-badge badge-buy";
  } else {
    descText = "金利差と需給のバランスが安定している中立的〜マイルドな為替レンジです。";
    rsiValEl.textContent = "RSI: 52.1 (中立)";
    rsiBadge.textContent = "Neutral";
    rsiBadge.className = "indicator-badge badge-neutral";
  }
  descEl.textContent = descText;
}

// Smooth scroll & Navigation active highlighting
function handleNavigation() {
  const sections = document.querySelectorAll('main > section');
  const navLinks = document.querySelectorAll('nav a');
  
  window.addEventListener('scroll', () => {
    let current = '';
    const scrollPosition = window.pageYOffset + 120; // offset header height

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href').includes(current) && current !== '') {
        link.classList.add('active');
      }
    });
  });
}

// Setup Event Listeners
function setupEventListeners() {
  // Chart Tabs
  const tabButtons = document.querySelectorAll('.btn-tab');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      tabButtons.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const period = e.target.getAttribute('data-period');
      updateChart(period);
    });
  });

  // Simulator Inputs
  const inputs = ['range-interest-diff', 'range-risk', 'range-trade'];
  inputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', runSimulator);
    }
  });
}

// Entry Point
document.addEventListener('DOMContentLoaded', async () => {
  initChart();
  
  // Fetch actual rates and chart data from real API
  await fetchRealRates();
  await fetchRealHistoryChart();
  
  simulateLiveRates();
  runSimulator();
  setupEventListeners();
  handleNavigation();
});
