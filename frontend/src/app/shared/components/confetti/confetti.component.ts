import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'rect' | 'circle' | 'triangle';
}

const COLORS = [
  '#ff6b6b', '#ffd93d', '#6c63ff', '#4ecdc4',
  '#ff9ff3', '#54a0ff', '#5f27cd', '#ff9f43',
  '#1dd1a1', '#ee5a24',
];

@Component({
  selector: 'app-confetti',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confetti.component.html',
  styleUrl: './confetti.component.scss',
})
export class ConfettiComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input() active = false;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private particles: Particle[] = [];
  private animationId: number | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private _ready = signal(false);

  ngAfterViewInit(): void {
    this._ready.set(true);
    if (this.active) {
      this.start();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['active']) {
      if (this.active && this._ready()) {
        this.start();
      } else if (!this.active) {
        this.stop();
      }
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private start(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.ctx = canvas.getContext('2d');

    this.particles = Array.from({ length: 120 }, () =>
      this.createParticle(canvas.width, canvas.height),
    );

    this.animate();
  }

  private stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.particles = [];
    if (this.ctx && this.canvasRef?.nativeElement) {
      this.ctx.clearRect(
        0, 0,
        this.canvasRef.nativeElement.width,
        this.canvasRef.nativeElement.height,
      );
    }
  }

  private createParticle(width: number, height: number): Particle {
    const shapes: Particle['shape'][] = ['rect', 'circle', 'triangle'];
    return {
      x: Math.random() * width,
      y: Math.random() * height * -1,
      vx: (Math.random() - 0.5) * 3,
      vy: Math.random() * 3 + 2,
      size: Math.random() * 10 + 5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.15,
      opacity: 1,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    };
  }

  private animate(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas || !this.ctx) return;

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);

    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.vy += 0.05; // gravity

      // Fade out near bottom
      if (p.y > canvas.height * 0.8) {
        p.opacity = Math.max(0, 1 - (p.y - canvas.height * 0.8) / (canvas.height * 0.2));
      }

      // Reset particle if off screen
      if (p.y > canvas.height + 20) {
        Object.assign(p, this.createParticle(canvas.width, canvas.height));
      }

      this.drawParticle(p);
    });

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  private drawParticle(p: Particle): void {
    if (!this.ctx) return;
    const ctx = this.ctx;

    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    switch (p.shape) {
      case 'rect':
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        break;
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -p.size / 2);
        ctx.lineTo(p.size / 2, p.size / 2);
        ctx.lineTo(-p.size / 2, p.size / 2);
        ctx.closePath();
        ctx.fill();
        break;
    }

    ctx.restore();
  }
}
