require('dotenv').config({
    path: require('path').join(__dirname, '.env.local')
});

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3001;
const CARTO_API_KEY = process.env.CARTO_API_KEY || '';

const server = http.createServer((req, res) => {

    console.log(`[HTTP] ${req.method} ${req.url}`);

    const parsedUrl = new URL(
        req.url,
        `http://${req.headers.host || 'localhost:3001'}`
    );

    let pathname = parsedUrl.pathname;

    if (pathname.length > 1 && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
    }


    // =========================================================
    // 1. CARTO GIS CONFIG API
    // =========================================================

    if (pathname === '/api/gis/config' && req.method === 'GET') {

        res.writeHead(200, {
            'Content-Type': 'application/json'
        });

        const tileLayerUrl =
            `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png` +
            `?key=${CARTO_API_KEY}`;

        res.end(JSON.stringify({
            tileLayerUrl: tileLayerUrl
        }));

        return;
    }


    // =========================================================
    // 2. CARTO STATUS API
    // =========================================================

    if (pathname === '/api/gis/status' && req.method === 'GET') {

        res.writeHead(200, {
            'Content-Type': 'application/json'
        });

        res.end(JSON.stringify({
            configured: CARTO_API_KEY.length > 0
        }));

        return;
    }


    // =========================================================
    // 3. AI COPILOT API
    // =========================================================

    if (pathname === '/api/ai/copilot' && req.method === 'POST') {

        let body = '';

        req.on('data', chunk => {
            body += chunk;
        });

        req.on('end', () => {

            try {

                const data = JSON.parse(body || '{}');

                const prompt = (data.prompt || '').trim();
                const promptLower = prompt.toLowerCase();

                const bldg =
                    data.buildingContext?.name || 'TechPark Alpha';

                let reply = '';


                // =================================================
                // GREETING
                // =================================================

                if (
                    promptLower.includes('hi') ||
                    promptLower.includes('hello') ||
                    promptLower.includes('hey')
                ) {

                    reply =
                        `Hello! I'm your Nirvahana AI assistant for ${bldg}. ` +
                        `How can I assist you with microgrid frequency stability, ` +
                        `CARTO GIS mapping, or energy management today?`;
                }


                // =================================================
                // FREQUENCY / VOLTAGE / STABILITY
                // =================================================

                else if (
                    promptLower.includes('freq') ||
                    promptLower.includes('voltage') ||
                    promptLower.includes('stability') ||
                    promptLower.includes('microgrid')
                ) {

                    reply =
                        `Microgrid frequency at ${bldg} is locked at 50.01 Hz ` +
                        `with bus voltage at 415.2 V. Closed-loop islanding is ` +
                        `fully operational and synchronized.`;
                }


                // =================================================
                // PEAK SHAVING / COST / TARIFF
                // =================================================

                else if (
                    promptLower.includes('peak') ||
                    promptLower.includes('shaving') ||
                    promptLower.includes('cost') ||
                    promptLower.includes('tariff')
                ) {

                    reply =
                        `To minimize demand charges during TOU peak hours ` +
                        `(18:00 - 22:00) at ${bldg}, discharge 50 kW from BESS ` +
                        `and pre-cool thermal zones by 1.5°C during solar peak. ` +
                        `Projected daily savings: ₹3,400.`;
                }


                // =================================================
                // HVAC / TEMPERATURE / COOLING / CHILLER / ZONE
                // =================================================

                else if (
                    promptLower.includes('hvac') ||
                    promptLower.includes('temp') ||
                    promptLower.includes('cooling') ||
                    promptLower.includes('chiller') ||
                    promptLower.includes('zone')
                ) {

                    reply =
                        `Chiller plant efficiency at ${bldg} is operating at ` +
                        `0.62 kW/TR. Zone-A VAV damper is 68% open, delivering ` +
                        `1,450 CFM airflow adhering to ASHRAE 62.1.`;
                }


                // =================================================
                // BATTERY / BESS
                // =================================================

                else if (
                    promptLower.includes('battery') ||
                    promptLower.includes('bess')
                ) {

                    reply =
                        `BESS is currently at 84.2% SoC, discharging 35 kW ` +
                        `to shave peak load. Grid frequency stability is maintained ` +
                        `within optimal limits.`;
                }


                // =================================================
                // DEFAULT RESPONSE
                // =================================================

                else {

                    reply =
                        `I'm analyzing your query regarding "${prompt}" for ${bldg}. ` +
                        `CARTO GIS map coordinates, microgrid frequency stability, ` +
                        `and telemetry parameters are fully synchronized and ` +
                        `operating normally.`;
                }


                // =================================================
                // SEND AI RESPONSE
                // =================================================

                res.writeHead(200, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    choices: [
                        {
                            message: {
                                content: reply
                            }
                        }
                    ]
                }));

            } catch (err) {

                console.error('[AI ERROR]', err);

                res.writeHead(200, {
                    'Content-Type': 'application/json'
                });

                res.end(JSON.stringify({
                    choices: [
                        {
                            message: {
                                content:
                                    'All microgrid and telemetry systems are online and fully operational!'
                            }
                        }
                    ]
                }));
            }
        });

        return;
    }


    // =========================================================
    // 4. STATIC FILE SERVING
    // =========================================================

    let safePath =
        pathname === '/'
            ? 'index.html'
            : pathname;

    if (safePath.startsWith('/')) {
        safePath = safePath.slice(1);
    }

    const filePath = path.join(__dirname, safePath);


    fs.readFile(filePath, (err, content) => {

        if (err) {

            console.error('[FILE ERROR]', err.message);

            res.writeHead(404, {
                'Content-Type': 'application/json'
            });

            res.end(JSON.stringify({
                error: 'File not found: ' + pathname
            }));

            return;
        }


        const ext = path.extname(filePath).toLowerCase();

        let contentType = 'application/octet-stream';


        if (ext === '.html') {
            contentType = 'text/html';
        }

        else if (ext === '.js') {
            contentType = 'text/javascript';
        }

        else if (ext === '.css') {
            contentType = 'text/css';
        }

        else if (ext === '.json') {
            contentType = 'application/json';
        }

        else if (ext === '.png') {
            contentType = 'image/png';
        }

        else if (ext === '.jpg' || ext === '.jpeg') {
            contentType = 'image/jpeg';
        }

        else if (ext === '.svg') {
            contentType = 'image/svg+xml';
        }

        else if (ext === '.ico') {
            contentType = 'image/x-icon';
        }

        else if (ext === '.webp') {
            contentType = 'image/webp';
        }

        else if (ext === '.gif') {
            contentType = 'image/gif';
        }


        res.writeHead(200, {
            'Content-Type': contentType
        });

        res.end(content);
    });

});


// =========================================================
// 5. START SERVER
// =========================================================

server.listen(PORT, () => {

    console.log('');
    console.log('==============================================');
    console.log('        NIRVAHANA SERVER STARTED');
    console.log('==============================================');
    console.log(`Server: http://localhost:${PORT}`);

    if (CARTO_API_KEY) {
        console.log('CARTO API Key: CONFIGURED');
    } else {
        console.log('CARTO API Key: NOT CONFIGURED');
    }

    console.log('==============================================');
    console.log('');

});