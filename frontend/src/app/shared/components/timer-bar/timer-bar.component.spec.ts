import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  discardPeriodicTasks,
} from '@angular/core/testing';
import { TimerBarComponent } from './timer-bar.component';

describe('TimerBarComponent', () => {
  let component: TimerBarComponent;
  let fixture: ComponentFixture<TimerBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimerBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TimerBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with full timer when not active', () => {
    component.durationMs = 5000;
    component.active = false;
    fixture.detectChanges();

    expect(component.percentRemaining()).toBe(100);
    expect(component.secondsRemaining()).toBe(5);
  });

  it('should show correct seconds initially', () => {
    component.durationMs = 15000;
    component.active = false;
    fixture.detectChanges();

    expect(component.secondsRemaining()).toBe(15);
  });

  it('should emit timerExpired after the full duration', fakeAsync(() => {
    const expiredSpy = jasmine.createSpy('timerExpired');
    component.durationMs = 1000;
    component.timerExpired.subscribe(expiredSpy);
    component.active = true;
    component.ngOnChanges({
      active: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false },
      durationMs: { currentValue: 1000, previousValue: 15000, firstChange: false, isFirstChange: () => false },
    });

    fixture.detectChanges();

    tick(1100);
    fixture.detectChanges();

    expect(expiredSpy).toHaveBeenCalledTimes(1);
    discardPeriodicTasks();
  }));

  it('should NOT emit timerExpired if active is false', fakeAsync(() => {
    const expiredSpy = jasmine.createSpy('timerExpired');
    component.durationMs = 500;
    component.timerExpired.subscribe(expiredSpy);
    component.active = false;
    fixture.detectChanges();

    tick(600);
    fixture.detectChanges();

    expect(expiredSpy).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('should stop timer when active changes to false', fakeAsync(() => {
    const expiredSpy = jasmine.createSpy('timerExpired');
    component.durationMs = 2000;
    component.timerExpired.subscribe(expiredSpy);

    component.active = true;
    component.ngOnChanges({
      active: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false },
      durationMs: { currentValue: 2000, previousValue: 15000, firstChange: false, isFirstChange: () => false },
    });
    fixture.detectChanges();

    tick(500);

    // Stop the timer
    component.active = false;
    component.ngOnChanges({
      active: { currentValue: false, previousValue: true, firstChange: false, isFirstChange: () => false },
      durationMs: { currentValue: 2000, previousValue: 2000, firstChange: false, isFirstChange: () => false },
    });
    fixture.detectChanges();

    tick(2000);
    fixture.detectChanges();

    expect(expiredSpy).not.toHaveBeenCalled();
    discardPeriodicTasks();
  }));

  it('colorClass should be green when > 60% remaining', () => {
    component.durationMs = 15000;
    component.active = false;
    fixture.detectChanges();

    expect(component.colorClass()).toBe('green');
  });
});
