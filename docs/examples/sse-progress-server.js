const http = require('http');

const PORT = 3000;

function writeSseHeaders(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
}

function sendEvent(res, eventName, payload, id) {
  if (id !== undefined) {
    res.write(`id: ${id}\n`);
  }
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

const server = http.createServer((req, res) => {
  if (req.url !== '/progress-sse') {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
    return;
  }

  writeSseHeaders(res);

  const jobId = 'job-1';
  let percent = 0;
  let seq = 0;

  const heartbeatTimer = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 10000);

  const progressTimer = setInterval(() => {
    const payload = {
      jobId,
      percent,
      message: percent === 100 ? 'complete' : 'processing',
      timestamp: new Date().toISOString(),
    };

    sendEvent(res, 'progress', payload, seq);

    if (percent >= 100) {
      sendEvent(
        res,
        'done',
        { jobId, timestamp: new Date().toISOString() },
        seq + 1,
      );
      clearInterval(progressTimer);
      clearInterval(heartbeatTimer);
      res.end();
      return;
    }

    percent += 10;
    seq += 1;
  }, 1000);

  req.on('close', () => {
    clearInterval(progressTimer);
    clearInterval(heartbeatTimer);
  });
});

server.listen(PORT, () => {
  console.log(`SSE server running: http://localhost:${PORT}/progress-sse`);
});
