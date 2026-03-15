import { Router, Request, Response, NextFunction } from 'express';
import { query, queryOne } from '../../db/client';
import { pool } from '../../db/client';
import { adminOnly } from '../../shared/middleware/adminOnly';
import os from 'os';
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const router = Router();
router.use(adminOnly);

const LOG_FILES: Record<string, string> = {
  backend: '/tmp/aite_backend.log',
  frontend: '/tmp/aite_frontend.log',
};

const APP_PROCESS_PATTERNS = ['tsx src/server', 'serve-static.js', 'aite_'];

// ── Health ────────────────────────────────────────────────────────────────────
router.get('/health', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await pool.query('SELECT 1');
    const mem = process.memoryUsage();
    res.json({
      success: true, data: {
        status: 'ok',
        uptime: Math.floor(process.uptime()),
        memory: { heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024), heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024) },
        cpu: { cores: os.cpus().length, loadAvg: os.loadavg() },
        freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
        totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
        db: 'connected',
      }
    });
  } catch (err) { next(err); }
});

// ── API Usage ─────────────────────────────────────────────────────────────────
router.get('/api-usage', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totals, byModel, recent, cacheStats] = await Promise.all([
      queryOne<Record<string, string>>('SELECT SUM(tokens_in) as total_in, SUM(tokens_out) as total_out, COUNT(*) as total_calls FROM api_usage_log'),
      query<Record<string, string>>('SELECT model, COUNT(*) as calls, SUM(tokens_in) as tokens_in, SUM(tokens_out) as tokens_out FROM api_usage_log GROUP BY model ORDER BY calls DESC'),
      query<Record<string, string>>('SELECT model, purpose, tokens_in, tokens_out, created_at FROM api_usage_log ORDER BY created_at DESC LIMIT 20'),
      queryOne<Record<string, string>>('SELECT COUNT(*) as total, SUM(CASE WHEN cache_hit THEN 1 ELSE 0 END) as hits FROM api_usage_log'),
    ]);
    res.json({ success: true, data: { totals, byModel, recent, cacheStats } });
  } catch (err) { next(err); }
});

// ── Cache ─────────────────────────────────────────────────────────────────────
router.get('/cache', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [content, evaluation] = await Promise.all([
      query('SELECT class_level, subject, theme_slug, COUNT(*) as chapters_cached FROM content_cache GROUP BY class_level, subject, theme_slug ORDER BY class_level, subject'),
      query('SELECT class_level, subject, theme_slug, COUNT(*) as chapters_cached FROM evaluation_cache GROUP BY class_level, subject, theme_slug ORDER BY class_level, subject'),
    ]);
    res.json({ success: true, data: { contentCache: content, evaluationCache: evaluation } });
  } catch (err) { next(err); }
});

// ── Processes ─────────────────────────────────────────────────────────────────
router.get('/processes', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const backendPidFile = '/tmp/aite_backend.pid';
    const frontendPidFile = '/tmp/aite_frontend.pid';
    const backendPid = fs.existsSync(backendPidFile) ? parseInt(fs.readFileSync(backendPidFile, 'utf8').trim()) : null;
    const frontendPid = fs.existsSync(frontendPidFile) ? parseInt(fs.readFileSync(frontendPidFile, 'utf8').trim()) : null;

    // Get full process list
    let rawPs = '';
    try {
      rawPs = execSync('ps aux', { encoding: 'utf8', timeout: 5000 });
    } catch { rawPs = ''; }

    const rows = rawPs.split('\n').slice(1).filter(Boolean);
    const processes: Array<{pid: number; name: string; role: string; cpu: string; mem: string; command: string; isAppProcess: boolean}> = [];

    // PostgreSQL processes
    for (const row of rows) {
      const cols = row.trim().split(/\s+/);
      if (cols.length < 11) continue;
      const pid = parseInt(cols[1]!);
      const cpu = cols[2]!;
      const mem = cols[3]!;
      const command = cols.slice(10).join(' ');

      if (command.includes('postgres') || command.includes('tsx src/server') || command.includes('serve-static')) {
        let role = 'Other';
        let name = path.basename(command.split(' ')[0]!);

        if (command.includes('tsx src/server')) { role = 'Backend (Express)'; name = 'node (backend)'; }
        else if (command.includes('serve-static')) { role = 'Frontend (static server)'; name = 'node (frontend)'; }
        else if (command.includes('postgres') && !command.includes('grep')) {
          if (command.includes('autovacuum')) { role = 'PostgreSQL autovacuum'; name = 'postgres: autovacuum'; }
          else if (command.includes('checkpointer')) { role = 'PostgreSQL checkpointer'; name = 'postgres: checkpointer'; }
          else if (command.includes('walwriter')) { role = 'PostgreSQL WAL writer'; name = 'postgres: walwriter'; }
          else if (command.includes('background writer')) { role = 'PostgreSQL BG writer'; name = 'postgres: bg writer'; }
          else if (command.includes('logical replication')) { role = 'PostgreSQL replication'; name = 'postgres: replication'; }
          else { role = 'PostgreSQL main'; name = 'postgres'; }
        }

        processes.push({
          pid, name, role, cpu, mem,
          command: command.slice(0, 80),
          isAppProcess: pid === backendPid || pid === frontendPid ||
            command.includes('tsx src/server') || command.includes('serve-static'),
        });
      }
    }

    res.json({ success: true, data: { processes, backendPid, frontendPid } });
  } catch (err) { next(err); }
});

// DELETE /api/observability/processes/:pid — kill a process
router.delete('/processes/:pid', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pid = parseInt(req.params['pid']!);
    if (isNaN(pid) || pid < 1) { res.status(400).json({ success: false, error: { message: 'Invalid PID' } }); return; }
    try {
      process.kill(pid, 'SIGTERM');
      res.json({ success: true, message: `Sent SIGTERM to PID ${pid}` });
    } catch {
      res.status(404).json({ success: false, error: { message: `Process ${pid} not found or already stopped` } });
    }
  } catch (err) { next(err); }
});

// ── Log Streaming (SSE) ───────────────────────────────────────────────────────
router.get('/logs/:logname', (req: Request, res: Response) => {
  const logname = req.params['logname']!;
  const logFile = LOG_FILES[logname];

  if (!logFile) {
    res.status(404).json({ success: false, error: { message: `Unknown log: ${logname}` } });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send last 50 lines immediately
  if (fs.existsSync(logFile)) {
    try {
      const tail = execSync(`tail -50 "${logFile}"`, { encoding: 'utf8' });
      const lines = tail.split('\n').filter(Boolean);
      for (const line of lines) {
        res.write(`data: ${JSON.stringify(line)}\n\n`);
      }
    } catch { /* file may be empty */ }
  } else {
    res.write(`data: ${JSON.stringify(`[Log file not yet created: ${logFile}]`)}\n\n`);
  }

  // Stream new lines via tail -f
  const tail = spawn('tail', ['-f', logFile], { stdio: ['ignore', 'pipe', 'ignore'] });
  tail.stdout.on('data', (chunk: Buffer) => {
    const lines = chunk.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      res.write(`data: ${JSON.stringify(line)}\n\n`);
    }
  });

  req.on('close', () => { tail.kill(); });
});

// ── Tests ─────────────────────────────────────────────────────────────────────
const TEST_RESULTS_FILE = '/tmp/aite_test_results.json';

router.post('/tests/run', async (_req: Request, res: Response) => {
  // Run tests in background and save results
  res.json({ success: true, message: 'Tests started in background' });

  const backendDir = path.join(process.cwd());
  const child = spawn('npm', ['run', 'test:unit', '--', '--json', '--outputFile', TEST_RESULTS_FILE], {
    cwd: backendDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_ENV: 'test' },
  });

  const output: string[] = [];
  child.stdout.on('data', (d: Buffer) => output.push(d.toString()));
  child.stderr.on('data', (d: Buffer) => output.push(d.toString()));

  child.on('close', (code) => {
    // Also save a summary
    const summary = { runAt: new Date().toISOString(), exitCode: code, rawOutput: output.join('') };
    try {
      if (!fs.existsSync(TEST_RESULTS_FILE)) {
        fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify({ testResults: [], ...summary }));
      } else {
        const existing = JSON.parse(fs.readFileSync(TEST_RESULTS_FILE, 'utf8'));
        fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify({ ...existing, ...summary }));
      }
    } catch { /* ignore */ }
  });
});

router.get('/tests/results', (_req: Request, res: Response, next: NextFunction) => {
  try {
    if (!fs.existsSync(TEST_RESULTS_FILE)) {
      res.json({ success: true, data: { ran: false } });
      return;
    }
    const raw = fs.readFileSync(TEST_RESULTS_FILE, 'utf8');
    const data = JSON.parse(raw);
    res.json({ success: true, data: { ran: true, ...data } });
  } catch (err) { next(err); }
});

export default router;
