const coinSelector = document.getElementById('coin-selector');
const timeframeSelector = document.getElementById('timeframe-selector');
const chartCanvas = document.getElementById('candlestickChart');
// import 'chartjs-chart-financial';

const { Chart, TimeScale, LinearScale } = window.Chart;
const { CandlestickController, CandlestickElement } = window.CandlestickController;
Chart.register(TimeScale, LinearScale, CandlestickController, CandlestickElement);


// Rest of your code...
// Register the candlestick chart type
Chart.register(Chart.FinancialController, Chart.CandlestickElement);

let socket;
let chart;
let coinData = {
    ethusdt: [],
    bnbusdt: [],
    dotusdt: []
};
let currentCoin = 'ethusdt';
let currentInterval = '1m';

// Initialize Chart.js
function initializeChart() {
    const ctx = chartCanvas.getContext('2d');
    chart = new Chart(ctx, {
        type: 'candlestick',
        data: {
            datasets: [{
                label: 'Candlestick Data',
                data: []
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'minute'
                    },
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Price (USDT)'
                    }
                }
            }
        }
    });
}


// Update chart with new candlestick data
function updateChart(data) {
    chart.data.datasets[0].data = data;
    chart.update();
}

// Connect to Binance WebSocket
function connectWebSocket(symbol, interval) {
    const wsUrl = `wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`;
    socket = new WebSocket(wsUrl);

    socket.onmessage = function (event) {
        const message = JSON.parse(event.data);
        const candlestick = message.k;

        const candlestickData = {
            x: new Date(candlestick.t),
            o: candlestick.o,
            h: candlestick.h,
            l: candlestick.l,
            c: candlestick.c
        };

        coinData[symbol].push(candlestickData);
        saveData(symbol);
        updateChart(coinData[symbol]);
    };

    socket.onclose = function () {
        console.log('WebSocket closed');
    };
}

// Save data to localStorage
function saveData(symbol) {
    localStorage.setItem(symbol, JSON.stringify(coinData[symbol]));
}

// Load data from localStorage
function loadData(symbol) {
    const storedData = localStorage.getItem(symbol);
    if (storedData) {
        coinData[symbol] = JSON.parse(storedData);
        updateChart(coinData[symbol]);
    }
}

// Switch coin and update chart
function switchCoin(symbol, interval) {
    if (socket) socket.close();  // Close previous WebSocket connection
    currentCoin = symbol;
    currentInterval = interval;
    loadData(symbol);
    connectWebSocket(symbol, interval);
}

// Handle coin and timeframe change
coinSelector.addEventListener('change', (event) => {
    const newCoin = event.target.value;
    switchCoin(newCoin, currentInterval);
});

timeframeSelector.addEventListener('change', (event) => {
    const newInterval = event.target.value;
    switchCoin(currentCoin, newInterval);
});

// Initialize app
initializeChart();
loadData(currentCoin);
connectWebSocket(currentCoin, currentInterval);