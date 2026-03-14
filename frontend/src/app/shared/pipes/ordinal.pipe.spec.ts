import { OrdinalPipe } from './ordinal.pipe';

describe('OrdinalPipe', () => {
  let pipe: OrdinalPipe;

  beforeEach(() => {
    pipe = new OrdinalPipe();
  });

  it('should create', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return 1st for 1', () => {
    expect(pipe.transform(1)).toBe('1st');
  });

  it('should return 2nd for 2', () => {
    expect(pipe.transform(2)).toBe('2nd');
  });

  it('should return 3rd for 3', () => {
    expect(pipe.transform(3)).toBe('3rd');
  });

  it('should return 4th for 4', () => {
    expect(pipe.transform(4)).toBe('4th');
  });

  it('should return 11th for 11 (special case)', () => {
    expect(pipe.transform(11)).toBe('11th');
  });

  it('should return 12th for 12 (special case)', () => {
    expect(pipe.transform(12)).toBe('12th');
  });

  it('should return 13th for 13 (special case)', () => {
    expect(pipe.transform(13)).toBe('13th');
  });

  it('should return 21st for 21', () => {
    expect(pipe.transform(21)).toBe('21st');
  });

  it('should return 22nd for 22', () => {
    expect(pipe.transform(22)).toBe('22nd');
  });

  it('should return 23rd for 23', () => {
    expect(pipe.transform(23)).toBe('23rd');
  });

  it('should return 100th for 100', () => {
    expect(pipe.transform(100)).toBe('100th');
  });
});
