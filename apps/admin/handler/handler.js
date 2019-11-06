const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const isUtf8 = require("isutf8");

module.exports.handler = async event => {
    let key = event.pathParameters ? event.pathParameters.key : "";
    let type = mime.lookup(key);
    let isBase64Encoded = false;

    if (!type) {
        type = "text/html";
        key = "index.html";
    }

    const filePath = path.resolve(key);

    try {
        let buffer = await new Promise((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if (err) return reject(err);
                resolve(data);
            });
        });

        isBase64Encoded = !isUtf8(buffer);
        const headers = {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": type
        };

        if (key.includes("static")) {
            headers["Cache-Control"] = "public, max-age=2592000";
        }

        return {
            statusCode: 200,
            headers,
            body: buffer.toString(isBase64Encoded ? "base64" : "utf8"),
            isBase64Encoded
        };
    } catch (e) {
        return {
            statusCode: 404,
            body: e.message,
            headers: {
                "Access-Control-Allow-Origin": "*"
            }
        };
    }
};
