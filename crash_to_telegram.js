// Install dependencies first: npm install ws axios
const WebSocket = require('ws');
const axios = require('axios');

// Telegram config
const BOT_TOKEN = '8554711479:AAF1Io8C5Bacd-oLBAo50iWONq_18ZitfNE';
const CHAT_ID = '1067650536';

// Crash game WebSocket
const SERVER_URL = 'wss://crash-game-backend-production.up.railway.app/predictor';
const ACCOUNT_NUMBER = 1567622943;

// Connect to the WebSocket
const ws = new WebSocket(SERVER_URL);

ws.on('open', () => {
    console.log('✅ Connected to Crash WebSocket');

    // Handshake
    ws.send(JSON.stringify({ protocol: 'json', version: 1 }));

    // Authenticate
    setTimeout(() => {
        ws.send(JSON.stringify({
            type: 1,
            target: 'Account',
            arguments: [{ activity: 30, account: ACCOUNT_NUMBER }],
            invocationId: '0'
        }));
        console.log('→ Authentication sent');
    }, 200);

    // Heartbeat every 10s
    setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 6 }));
        }
    }, 10000);
});

ws.on('message', (msg) => {
    try {
        const data = JSON.parse(msg);

        // Listen only for crash events
        if (data.type === 1 && data.target === 'OnCrash') {
            const crashMultiplier = data.arguments?.[0]?.f || 0;
            const gameStatus = data.arguments?.[0]?.s || 'flying';
            const predictedCrashTime = data.arguments?.[0]?.p || Date.now();

            const message = `💥 Crash Alert!\nMultiplier: ${crashMultiplier.toFixed(2)}x\nStatus: ${gameStatus}\nPredicted Time: ${predictedCrashTime}`;

            console.log(message);

            // Send to Telegram
            axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                params: {
                    chat_id: CHAT_ID,
                    text: message
                }
            }).catch(err => console.error('Telegram error:', err.message));
        }
    } catch (e) {
        console.error('Parse error:', e.message);
    }
});

ws.on('close', () => console.log('❌ Disconnected from WebSocket'));
ws.on('error', (err) => console.error('WebSocket error:', err));
