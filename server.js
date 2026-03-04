const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8000;
const DB_FILE = path.join(__dirname, 'db.json');

// 初期ファイル作成
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ helpers: [], users: [], templates: [], schedules: [], specificSchedules: {}, records: [] }, null, 2));
}

http.createServer((req, res) => {
    // API: GET /api/data
    if (req.url === '/api/data' && req.method === 'GET') {
        fs.readFile(DB_FILE, (err, data) => {
            if (err) {
                res.writeHead(500);
                res.end('Error reading DB');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(data);
        });
        return;
    }

    // API: POST /api/data
    if (req.url === '/api/data' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            fs.writeFile(DB_FILE, body, (err) => {
                if (err) {
                    res.writeHead(500);
                    res.end('Error writing DB');
                    return;
                }
                res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
                res.end(JSON.stringify({ status: 'success' }));
            });
        });
        return;
    }

    // 静的ファイルの提供
    let filePath = '.' + req.url;
    if (filePath === './' || filePath === '.') filePath = './index.html';

    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';
    const fullPath = path.resolve(__dirname, filePath);

    fs.readFile(fullPath, (error, content) => {
        if (error) {
            if (error.code == 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
            res.end(content, 'utf-8');
        }
    });
}).listen(port);

console.log(`Server running at http://localhost:${port}/`);
console.log(`スマホからは http://192.168.0.38:${port}/ にアクセスしてください`);
