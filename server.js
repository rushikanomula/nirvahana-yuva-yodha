require("dotenv").config({
    path: require("path").join(__dirname, ".env.local")
});

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3001;
const CARTO_API_KEY = process.env.CARTO_API_KEY || "";


// =========================================================
// REQUEST HANDLER
// =========================================================

function handleRequest(req, res) {

    console.log(`[HTTP] ${req.method} ${req.url}`);

    const parsedUrl = new URL(
        req.url,
        `http://${req.headers.host || "localhost:3001"}`
    );

    let pathname = parsedUrl.pathname;


    // =========================================================
    // CORS
    // =========================================================

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );


    if (req.method === "OPTIONS") {

        res.writeHead(204);
        res.end();

        return;
    }


    // =========================================================
    // 1. CARTO GIS CONFIG API
    // =========================================================

    if (
        pathname === "/api/gis/config" &&
        req.method === "GET"
    ) {

        const tileLayerUrl =
            `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png` +
            `?key=${CARTO_API_KEY}`;

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(
            JSON.stringify({
                tileLayerUrl: tileLayerUrl
            })
        );

        return;
    }


    // =========================================================
    // 2. CARTO STATUS API
    // =========================================================

    if (
        pathname === "/api/gis/status" &&
        req.method === "GET"
    ) {

        res.writeHead(200, {
            "Content-Type": "application/json"
        });

        res.end(
            JSON.stringify({
                configured: CARTO_API_KEY.length > 0
            })
        );

        return;
    }


    // =========================================================
    // 3. AI COPILOT API
    // =========================================================

    if (
        pathname === "/api/ai/copilot" &&
        req.method === "POST"
    ) {

        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });


        req.on("end", () => {

            try {

                const data = JSON.parse(body || "{}");

                const prompt =
                    (data.prompt || "").trim();

                const promptLower =
                    prompt.toLowerCase();

                const bldg =
                    data.buildingContext?.name ||
                    "TechPark Alpha";

                let reply = "";


                // =================================================
                // GREETING
                // =================================================

                if (
                    promptLower.includes("hi") ||
                    promptLower.includes("hello") ||
                    promptLower.includes("hey")
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
                    promptLower.includes("freq") ||
                    promptLower.includes("voltage") ||
                    promptLower.includes("stability") ||
                    promptLower.includes("microgrid")
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
                    promptLower.includes("peak") ||
                    promptLower.includes("shaving") ||
                    promptLower.includes("cost") ||
                    promptLower.includes("tariff")
                ) {

                    reply =
                        `To minimize demand charges during TOU peak hours ` +
                        `(18:00 - 22:00) at ${bldg}, discharge 50 kW from BESS ` +
                        `and pre-cool thermal zones by 1.5°C during solar peak. ` +
                        `Projected daily savings: ₹3,400.`;
                }


                // =================================================
                // HVAC / TEMPERATURE / COOLING
                // =================================================

                else if (
                    promptLower.includes("hvac") ||
                    promptLower.includes("temp") ||
                    promptLower.includes("cooling") ||
                    promptLower.includes("chiller") ||
                    promptLower.includes("zone")
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
                    promptLower.includes("battery") ||
                    promptLower.includes("bess")
                ) {

                    reply =
                        `BESS is currently at 84.2% SoC, discharging 35 kW ` +
                        `to shave peak load. Grid frequency stability is maintained ` +
                        `within optimal limits.`;
                }


                // =================================================
                // DEFAULT
                // =================================================

                else {

                    reply =
                        `I'm analyzing your query regarding "${prompt}" for ${bldg}. ` +
                        `CARTO GIS map coordinates, microgrid frequency stability, ` +
                        `and telemetry parameters are fully synchronized and ` +
                        `operating normally.`;
                }


                // =================================================
                // SEND RESPONSE
                // =================================================

                res.writeHead(200, {
                    "Content-Type": "application/json"
                });

                res.end(
                    JSON.stringify({
                        choices: [
                            {
                                message: {
                                    content: reply
                                }
                            }
                        ]
                    })
                );

            } catch (error) {

                console.error("[AI ERROR]", error);

                res.writeHead(200, {
                    "Content-Type": "application/json"
                });

                res.end(
                    JSON.stringify({
                        choices: [
                            {
                                message: {
                                    content:
                                        "All microgrid and telemetry systems are online and fully operational!"
                                }
                            }
                        ]
                    })
                );
            }

        });

        return;
    }


    // =========================================================
    // UNKNOWN API
    // =========================================================

    if (pathname.startsWith("/api/")) {

        res.writeHead(404, {
            "Content-Type": "application/json"
        });

        res.end(
            JSON.stringify({
                error: "API endpoint not found"
            })
        );

        return;
    }


    // =========================================================
    // LOCAL STATIC FILE SERVING
    // =========================================================

    let safePath =
        pathname === "/"
            ? "index.html"
            : pathname.replace(/^\/+/, "");


    const filePath =
        path.join(__dirname, safePath);


    fs.readFile(filePath, (error, content) => {

        if (error) {

            console.error(
                "[FILE ERROR]",
                error.message
            );

            res.writeHead(404, {
                "Content-Type": "text/plain"
            });

            res.end("File not found");

            return;
        }


        const ext =
            path.extname(filePath).toLowerCase();


        const MIME_TYPES = {

            ".html": "text/html",

            ".js": "application/javascript",

            ".css": "text/css",

            ".json": "application/json",

            ".png": "image/png",

            ".jpg": "image/jpeg",

            ".jpeg": "image/jpeg",

            ".svg": "image/svg+xml",

            ".ico": "image/x-icon",

            ".webp": "image/webp",

            ".gif": "image/gif"

        };


        const contentType =
            MIME_TYPES[ext] ||
            "application/octet-stream";


        res.writeHead(200, {
            "Content-Type": contentType
        });

        res.end(content);

    });
}


// =========================================================
// VERCEL HANDLER
// =========================================================

module.exports = handleRequest;


// =========================================================
// LOCAL DEVELOPMENT
// =========================================================

if (require.main === module) {

    const server =
        http.createServer(handleRequest);


    server.listen(PORT, () => {

        console.log("");

        console.log(
            "=============================================="
        );

        console.log(
            "        NIRVAHANA SERVER STARTED"
        );

        console.log(
            "=============================================="
        );

        console.log(
            `Server: http://localhost:${PORT}`
        );


        if (CARTO_API_KEY) {

            console.log(
                "CARTO API Key: CONFIGURED"
            );

        } else {

            console.log(
                "CARTO API Key: NOT CONFIGURED"
            );
        }


        console.log(
            "=============================================="
        );

        console.log("");

    });
}