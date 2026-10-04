const http = require("http");
const fs = require("fs");
const path = require("path");

// Load .env.local when running locally
require("dotenv").config({
    path: path.join(__dirname, ".env.local")
});

const PORT = process.env.PORT || 3001;

const CARTO_API_KEY = process.env.CARTO_API_KEY || "";

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


function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
    });

    res.end(JSON.stringify(data));
}


function serveFile(res, filePath) {
    fs.readFile(filePath, (error, data) => {
        if (error) {
            res.writeHead(404, {
                "Content-Type": "text/plain"
            });

            res.end("File not found");
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";

        res.writeHead(200, {
            "Content-Type": contentType
        });

        res.end(data);
    });
}


async function handleRequest(req, res) {

    // CORS
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );

    // Handle preflight requests
    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }


    // ================================
    // CARTO GIS CONFIG
    // ================================

    if (req.method === "GET" && req.url === "/api/gis/config") {

        sendJSON(res, 200, {
            tileUrl:
                `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_API_KEY}`
        });

        return;
    }


    // ================================
    // CARTO STATUS
    // ================================

    if (req.method === "GET" && req.url === "/api/gis/status") {

        sendJSON(res, 200, {
            configured: CARTO_API_KEY.length > 0
        });

        return;
    }


    // ================================
    // AI COPILOT
    // ================================

    if (req.method === "POST" && req.url === "/api/ai/copilot") {

        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {

            let query = "";

            try {
                const parsedBody = JSON.parse(body);
                query = parsedBody.query || "";
            } catch (error) {
                query = "";
            }

            const lowerQuery = query.toLowerCase();

            let response;


            // Greeting
            if (
                lowerQuery.includes("hello") ||
                lowerQuery.includes("hi") ||
                lowerQuery.includes("hey")
            ) {

                response = {
                    role: "assistant",
                    content:
                        "Hello! I'm Nirvahana AI Copilot. I can help you analyze building energy, HVAC, grid stability, batteries, and microgrid operations."
                };
            }


            // Frequency / Voltage / Stability / Microgrid
            else if (
                lowerQuery.includes("freq") ||
                lowerQuery.includes("voltage") ||
                lowerQuery.includes("stability") ||
                lowerQuery.includes("microgrid")
            ) {

                response = {
                    role: "assistant",
                    content:
                        "Current grid conditions are stable. Frequency is 50.01 Hz and voltage is 415.2 V."
                };
            }


            // Peak shaving / Cost / Tariff
            else if (
                lowerQuery.includes("peak") ||
                lowerQuery.includes("shaving") ||
                lowerQuery.includes("cost") ||
                lowerQuery.includes("tariff")
            ) {

                response = {
                    role: "assistant",
                    content:
                        "TOU peak period is 18:00–22:00. Recommended strategy: use the BESS at 50 kW, pre-cool the building by 1.5°C, and shift flexible loads. Estimated savings are ₹3,400."
                };
            }


            // HVAC / Temperature / Cooling / Chiller / Zone
            else if (
                lowerQuery.includes("hvac") ||
                lowerQuery.includes("temp") ||
                lowerQuery.includes("cooling") ||
                lowerQuery.includes("chiller") ||
                lowerQuery.includes("zone")
            ) {

                response = {
                    role: "assistant",
                    content:
                        "HVAC performance is currently stable. Cooling efficiency is 0.62 kW/TR, VAV operation is at 68%, and airflow is approximately 1,450 CFM."
                };
            }


            // Battery / BESS
            else if (
                lowerQuery.includes("battery") ||
                lowerQuery.includes("bess")
            ) {

                response = {
                    role: "assistant",
                    content:
                        "The BESS is currently at 84.2% state of charge and can discharge at approximately 35 kW."
                };
            }


            // Default
            else {

                response = {
                    role: "assistant",
                    content:
                        `I'm analyzing your query: "${query}". Nirvahana can provide insights into energy consumption, HVAC performance, grid stability, batteries, and building operations.`
                };
            }


            sendJSON(res, 200, response);
        });

        return;
    }


    // ================================
    // STATIC FILE SERVING
    // ================================

    let requestedPath = req.url.split("?")[0];

    if (requestedPath === "/") {
        requestedPath = "/index.html";
    }

    const filePath = path.join(
        __dirname,
        requestedPath
    );

    // Prevent path traversal
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403, {
            "Content-Type": "text/plain"
        });

        res.end("Forbidden");
        return;
    }

    serveFile(res, filePath);
}


// ========================================
// VERCEL HANDLER
// ========================================

module.exports = handleRequest;


// ========================================
// LOCAL DEVELOPMENT
// ========================================

if (require.main === module) {

    const server = http.createServer(handleRequest);

    server.listen(PORT, () => {
        console.log("");
        console.log("======================================");
        console.log("       NIRVAHANA SERVER");
        console.log("======================================");
        console.log(`Server running on port ${PORT}`);
        console.log(
            `CARTO API Key: ${
                CARTO_API_KEY.length > 0
                    ? "CONFIGURED"
                    : "NOT CONFIGURED"
            }`
        );
        console.log("======================================");
        console.log("");
    });
}

