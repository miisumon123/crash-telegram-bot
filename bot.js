const WebSocket = require('ws');
const https = require('https');

const SERVER_URL = 'wss://crash-game-backend-production.up.railway.app/predictor';
const ACCOUNT_NUMBER = 1567622943;

const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

function connect() {
    const ws = new WebSocket(SERVER_URL);

    ws.on('open', () => {
        console.log("Connected to crash server");

        ws.send(JSON.stringify({ protocol:'json', version:1 }));

        setTimeout(() => {
            ws.send(JSON.stringify({
                type: 1,
                target: 'Account',
                arguments: [{ activity: 30, account: ACCOUNT_NUMBER }],
                invocationId: '0'
            }));
        }, 200);
    });

    ws.on('message', (msg) => {
        try {
            const data = JSON.parse(msg);

            if (data.type === 1 && data.target === "OnCrash") {
                const crash = data.arguments?.[0]?.f || 0;

                const message =
                    `"crashMultiplier": ${crash.toFixed(2)},\n` +
                    `"gameStatus": "flying",\n` +
                    `"predictedCrashTime": ${Date.now()}`;

                sendTelegram(message);
            }

        } catch(e){}
    });

    ws.on('close', () => {
        console.log("Reconnecting...");
        setTimeout(connect, 3000);
    });
}

function sendTelegram(text) {
    const postData = JSON.stringify({
        chat_id: CHAT_ID,
        text: text
    });

    const options = {
        hostname: 'api.telegram.org',
        path: `/bot${BOT_TOKEN}/sendMessage`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }
    };

    const req = https.request(options);
    req.write(postData);
    req.end();

    console.log("Sent to Telegram");
}

connect();
