import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

interface Process { pid: number; name: string; role: string; cpu: string; mem: string; command: string; isAppProcess: boolean; }

interface LogTab { name: string; lines: string[]; eventSource?: EventSource; }

interface TestResult { ran: boolean; runAt?: string; exitCode?: number; testResults?: TestSuite[]; rawOutput?: string; }
interface TestSuite { testFilePath?: string; testResults?: TestCase[]; }
interface TestCase { fullName: string; status: string; duration?: number; failureMessages?: string[]; }

@Component({
  selector: 'app-observability',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './observability.component.html',
  styleUrls: ['./observability.component.scss'],
})
export class ObservabilityComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  health = signal<Record<string, unknown> | null>(null);
  apiUsage = signal<Record<string, unknown> | null>(null);
  cache = signal<Record<string, unknown> | null>(null);
  processes = signal<{ processes: Process[]; backendPid: number | null; frontendPid: number | null } | null>(null);
  testResults = signal<TestResult | null>(null);
  testsRunning = signal(false);
  error = signal('');

  logTabs = signal<LogTab[]>([]);
  activeLogTab = signal('');
  expandedTest = signal('');

  ngOnInit() { this.load(); }

  ngOnDestroy() {
    // Close all SSE connections
    for (const tab of this.logTabs()) tab.eventSource?.close();
  }

  load() {
    this.api.get<Record<string, unknown>>('/observability/health').subscribe({ next: r => this.health.set(r.data), error: () => this.error.set('Admin only — access from localhost') });
    this.api.get<Record<string, unknown>>('/observability/api-usage').subscribe({ next: r => this.apiUsage.set(r.data) });
    this.api.get<Record<string, unknown>>('/observability/cache').subscribe({ next: r => this.cache.set(r.data) });
    this.loadProcesses();
    this.loadTestResults();
  }

  loadProcesses() {
    this.api.get<{ processes: Process[]; backendPid: number | null; frontendPid: number | null }>('/observability/processes')
      .subscribe({ next: r => this.processes.set(r.data) });
  }

  killProcess(pid: number) {
    if (!confirm(`Kill process ${pid}?`)) return;
    this.api.delete(`/observability/processes/${pid}`).subscribe({
      next: () => setTimeout(() => this.loadProcesses(), 1000),
      error: () => alert('Failed to kill process'),
    });
  }

  openLog(name: string) {
    const existing = this.logTabs().find(t => t.name === name);
    if (existing) { this.activeLogTab.set(name); return; }

    const tab: LogTab = { name, lines: [] };
    const es = new EventSource(`http://localhost:3001/api/observability/logs/${name}`);
    es.onmessage = (e) => {
      try {
        const line = JSON.parse(e.data);
        tab.lines = [...tab.lines.slice(-200), line]; // keep last 200
        this.logTabs.update(tabs => tabs.map(t => t.name === name ? { ...t, lines: tab.lines } : t));
      } catch { /* ignore */ }
    };
    tab.eventSource = es;
    this.logTabs.update(tabs => [...tabs, tab]);
    this.activeLogTab.set(name);
  }

  closeLogTab(name: string) {
    const tab = this.logTabs().find(t => t.name === name);
    tab?.eventSource?.close();
    this.logTabs.update(tabs => tabs.filter(t => t.name !== name));
    if (this.activeLogTab() === name) this.activeLogTab.set(this.logTabs()[0]?.name ?? '');
  }

  activeLogLines(): string[] {
    return this.logTabs().find(t => t.name === this.activeLogTab())?.lines ?? [];
  }

  runTests() {
    this.testsRunning.set(true);
    this.api.post<unknown>('/observability/tests/run', {}).subscribe({
      next: () => {
        // Poll for results every 3s for up to 60s
        let polls = 0;
        const poll = setInterval(() => {
          polls++;
          this.loadTestResults();
          if (polls > 20) clearInterval(poll);
        }, 3000);
        setTimeout(() => { clearInterval(poll); this.testsRunning.set(false); }, 60000);
      },
      error: () => this.testsRunning.set(false),
    });
  }

  loadTestResults() {
    this.api.get<TestResult>('/observability/tests/results').subscribe({
      next: r => { this.testResults.set(r.data); if (r.data.ran) this.testsRunning.set(false); },
    });
  }

  allTestCases(): Array<{ suite: string; name: string; status: string; duration?: number; failures: string[] }> {
    const tr = this.testResults();
    if (!tr?.testResults) return [];
    const results: Array<{ suite: string; name: string; status: string; duration?: number; failures: string[] }> = [];
    for (const suite of tr.testResults) {
      const suiteName = suite.testFilePath?.split('/').pop() ?? 'Unknown Suite';
      for (const tc of suite.testResults ?? []) {
        results.push({ suite: suiteName, name: tc.fullName, status: tc.status, duration: tc.duration, failures: tc.failureMessages ?? [] });
      }
    }
    return results;
  }

  toggleTest(name: string) { this.expandedTest.set(this.expandedTest() === name ? '' : name); }
}
