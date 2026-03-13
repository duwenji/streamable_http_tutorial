const http = require('http');

const PORT = 3001;

function writeJsonLine(res, obj) {
  res.write(`${JSON.stringify(obj)}\n`);
}

const server = http.createServer((req, res) => {
  if (req.url !== '/progress-stream') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'application/x-ndjson; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Transfer-Encoding': 'chunked',
    'Access-Control-Allow-Origin': '*',
  });

  const jobId = 'job-1';
  let percent = 0;

  const timer = setInterval(() => {
    writeJsonLine(res, {
      type: 'progress',
      jobId,
      percent,
      message: percent === 100 ? 'complete' : 'processing',
      timestamp: new Date().toISOString(),
    });

    if (percent >= 100) {
      writeJsonLine(res, {
        type: 'done',
        jobId,
        percent: 100,
        message: 'complete',
        timestamp: new Date().toISOString(),
      });
      clearInterval(timer);
      res.end();
      return;
    }

    percent += 10;
  }, 1000);

  req.on('close', () => {
    clearInterval(timer);
  });
});

server.listen(PORT, () => {
  console.log(
    `Streamable HTTP server running: http://localhost:${PORT}/progress-stream`,
  );
});
