import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SoundService {
  private audioCtx: AudioContext | null = null;

  private _isMuted = signal(false);
  readonly isMuted = this._isMuted.asReadonly();

  toggleMute(): void {
    this._isMuted.update((v) => !v);
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      try {
        this.audioCtx = new AudioContext();
      } catch {
        return null;
      }
    }
    return this.audioCtx;
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    startTime?: number,
    gainValue = 0.3,
  ): void {
    if (this._isMuted()) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime + (startTime ?? 0));

    const start = ctx.currentTime + (startTime ?? 0);
    gainNode.gain.setValueAtTime(gainValue, start);
    gainNode.gain.exponentialRampToValueAtTime(0.001, start + duration);

    oscillator.start(start);
    oscillator.stop(start + duration);
  }

  playCorrect(): void {
    // Pleasant ascending ding: C5 -> E5 -> G5
    this.playTone(523.25, 0.15, 'sine', 0, 0.3);
    this.playTone(659.25, 0.15, 'sine', 0.1, 0.3);
    this.playTone(783.99, 0.25, 'sine', 0.2, 0.35);
  }

  playWrong(): void {
    // Low descending buzz
    this.playTone(220, 0.15, 'sawtooth', 0, 0.2);
    this.playTone(180, 0.2, 'sawtooth', 0.12, 0.2);
  }

  playLevelUp(): void {
    // Ascending fanfare: C5 E5 G5 C6
    this.playTone(523.25, 0.12, 'sine', 0, 0.3);
    this.playTone(659.25, 0.12, 'sine', 0.1, 0.3);
    this.playTone(783.99, 0.12, 'sine', 0.2, 0.3);
    this.playTone(1046.5, 0.35, 'sine', 0.3, 0.4);
  }

  playClick(): void {
    this.playTone(880, 0.05, 'sine', 0, 0.15);
  }

  playTimerWarning(): void {
    this.playTone(440, 0.08, 'square', 0, 0.1);
  }
}
