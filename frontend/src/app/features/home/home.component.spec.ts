import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { Player } from '../../core/models/player.model';

const mockPlayer: Player = {
  id: 'player-001',
  displayName: 'Ashvik',
  avatarCode: '🦁',
  totalCoins: 0,
  currentStreak: 0,
  longestStreak: 0,
};

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [HomeComponent, HttpClientTestingModule, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the app title', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("Ashvik's Math Adventure");
  });

  it('should render 6 avatar buttons', () => {
    const avatarBtns = fixture.debugElement.queryAll(By.css('.avatar-btn'));
    expect(avatarBtns.length).toBe(6);
  });

  it('should show error when name is empty on submit', () => {
    component.nameValue = '';
    fixture.detectChanges();

    const startBtn = fixture.debugElement.query(By.css('.start-btn'));
    (startBtn.nativeElement as HTMLButtonElement).click();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Please enter your name!');
  });

  it('should show error when name is too short', () => {
    component.nameValue = 'A';
    fixture.detectChanges();

    const startBtn = fixture.debugElement.query(By.css('.start-btn'));
    (startBtn.nativeElement as HTMLButtonElement).click();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('at least 2 characters');
  });

  it('should select avatar when avatar button is clicked', () => {
    const avatarBtns = fixture.debugElement.queryAll(By.css('.avatar-btn'));
    (avatarBtns[2].nativeElement as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(component.selectedAvatar()).toBe('🦊');
  });

  it('should call createPlayer with name and avatar on submit', fakeAsync(() => {
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    component.nameValue = 'Ashvik';
    component.selectAvatar('🦁');
    fixture.detectChanges();

    const startBtn = fixture.debugElement.query(By.css('.start-btn'));
    (startBtn.nativeElement as HTMLButtonElement).click();
    fixture.detectChanges();

    const req = httpMock.expectOne((r) => r.url.includes('/players'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ displayName: 'Ashvik', avatarCode: '🦁' });

    req.flush({ success: true, data: mockPlayer, timestamp: new Date().toISOString() });
    tick();

    expect(navigateSpy).toHaveBeenCalledWith(['/difficulty']);
  }));

  it('should disable submit button while loading', fakeAsync(() => {
    component.nameValue = 'Ashvik';
    fixture.detectChanges();

    const startBtn = fixture.debugElement.query(By.css('.start-btn'));
    (startBtn.nativeElement as HTMLButtonElement).click();
    fixture.detectChanges();

    const btn = startBtn.nativeElement as HTMLButtonElement;
    expect(btn.disabled).toBeTrue();

    const req = httpMock.expectOne((r) => r.url.includes('/players'));
    req.flush({ success: true, data: mockPlayer, timestamp: new Date().toISOString() });
    tick();
  }));
});
