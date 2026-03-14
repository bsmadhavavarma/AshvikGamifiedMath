import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PlayerService } from './player.service';
import { Player } from '../models/player.model';

const PLAYER_STORAGE_KEY = 'ashvik_player';

const mockPlayer: Player = {
  id: 'player-123',
  displayName: 'Ashvik',
  avatarCode: '🦁',
  totalCoins: 50,
  currentStreak: 3,
  longestStreak: 5,
};

describe('PlayerService', () => {
  let service: PlayerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PlayerService],
    });

    service = TestBed.inject(PlayerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with null player when localStorage is empty', () => {
    expect(service.player()).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('should load player from localStorage on init', () => {
    localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(mockPlayer));

    // Re-create service to trigger constructor
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PlayerService],
    });
    const freshService = TestBed.inject(PlayerService);

    expect(freshService.player()).toEqual(mockPlayer);
    expect(freshService.isLoggedIn()).toBeTrue();
  });

  it('should handle corrupt localStorage data gracefully', () => {
    localStorage.setItem(PLAYER_STORAGE_KEY, 'not-valid-json');

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PlayerService],
    });
    const freshService = TestBed.inject(PlayerService);

    expect(freshService.player()).toBeNull();
    expect(localStorage.getItem(PLAYER_STORAGE_KEY)).toBeNull();
  });

  it('should createPlayer, update signal, and save to localStorage', fakeAsync(() => {
    service.createPlayer('Ashvik', '🦁').subscribe({
      next: (player) => {
        expect(player).toEqual(mockPlayer);
      },
    });

    const req = httpMock.expectOne((r) => r.url.includes('/players'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ displayName: 'Ashvik', avatarCode: '🦁' });

    req.flush({ success: true, data: mockPlayer, timestamp: new Date().toISOString() });
    tick();

    expect(service.player()).toEqual(mockPlayer);
    expect(service.isLoggedIn()).toBeTrue();

    const stored = JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY) ?? 'null') as Player;
    expect(stored).toEqual(mockPlayer);
  }));

  it('should update isLoggedIn computed signal when player is set', fakeAsync(() => {
    expect(service.isLoggedIn()).toBeFalse();

    service.createPlayer('Ashvik', '🦁').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes('/players'));
    req.flush({ success: true, data: mockPlayer, timestamp: new Date().toISOString() });
    tick();

    expect(service.isLoggedIn()).toBeTrue();
  }));

  it('should clear player and localStorage on logout', fakeAsync(() => {
    service.createPlayer('Ashvik', '🦁').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes('/players'));
    req.flush({ success: true, data: mockPlayer, timestamp: new Date().toISOString() });
    tick();

    expect(service.isLoggedIn()).toBeTrue();

    service.logout();

    expect(service.player()).toBeNull();
    expect(service.isLoggedIn()).toBeFalse();
    expect(localStorage.getItem(PLAYER_STORAGE_KEY)).toBeNull();
  }));

  it('should updateLocalPlayer without API call', fakeAsync(() => {
    service.createPlayer('Ashvik', '🦁').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes('/players'));
    req.flush({ success: true, data: mockPlayer, timestamp: new Date().toISOString() });
    tick();

    service.updateLocalPlayer({ totalCoins: 100 });

    expect(service.player()?.totalCoins).toBe(100);
    expect(service.player()?.displayName).toBe('Ashvik');

    const stored = JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY) ?? 'null') as Player;
    expect(stored.totalCoins).toBe(100);
  }));
});
