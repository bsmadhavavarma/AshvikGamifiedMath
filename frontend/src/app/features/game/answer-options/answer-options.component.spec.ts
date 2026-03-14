import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnswerOptionsComponent } from './answer-options.component';
import { By } from '@angular/platform-browser';

describe('AnswerOptionsComponent', () => {
  let component: AnswerOptionsComponent;
  let fixture: ComponentFixture<AnswerOptionsComponent>;

  const testOptions = ['20%', '25%', '30%', '35%'];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnswerOptionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AnswerOptionsComponent);
    component = fixture.componentInstance;
    component.options = testOptions;
    component.disabled = false;
    component.correctOption = null;
    component.selectedOption = null;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render 4 answer buttons', () => {
    const buttons = fixture.debugElement.queryAll(By.css('.answer-btn'));
    expect(buttons.length).toBe(4);
  });

  it('should display option labels A, B, C, D', () => {
    const labels = fixture.debugElement.queryAll(By.css('.option-label'));
    expect(labels.map((l) => l.nativeElement.textContent.trim())).toEqual(['A', 'B', 'C', 'D']);
  });

  it('should emit optionSelected with correct value when button clicked', () => {
    const selectedSpy = jasmine.createSpy('optionSelected');
    component.optionSelected.subscribe(selectedSpy);

    const buttons = fixture.debugElement.queryAll(By.css('.answer-btn'));
    (buttons[1].nativeElement as HTMLButtonElement).click();

    expect(selectedSpy).toHaveBeenCalledWith('25%');
  });

  it('should NOT emit optionSelected when disabled', () => {
    const selectedSpy = jasmine.createSpy('optionSelected');
    component.optionSelected.subscribe(selectedSpy);
    component.disabled = true;
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('.answer-btn'));
    (buttons[0].nativeElement as HTMLButtonElement).click();

    expect(selectedSpy).not.toHaveBeenCalled();
  });

  it('should show correct option with correct class when correctOption is set', () => {
    component.correctOption = '25%';
    component.selectedOption = '25%';
    fixture.detectChanges();

    expect(component.getOptionState('25%')).toBe('correct');
    expect(component.getOptionState('20%')).toBe('default');
  });

  it('should show wrong option with wrong class when selected is different from correct', () => {
    component.correctOption = '25%';
    component.selectedOption = '20%';
    fixture.detectChanges();

    expect(component.getOptionState('20%')).toBe('wrong');
    expect(component.getOptionState('25%')).toBe('correct');
  });

  it('should show selected state before correctOption is revealed', () => {
    component.correctOption = null;
    component.selectedOption = '30%';
    fixture.detectChanges();

    expect(component.getOptionState('30%')).toBe('selected');
    expect(component.getOptionState('25%')).toBe('default');
  });

  it('should have disabled attribute when disabled is true', () => {
    component.disabled = true;
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('.answer-btn'));
    buttons.forEach((btn) => {
      expect((btn.nativeElement as HTMLButtonElement).disabled).toBeTrue();
    });
  });

  it('should emit first option when first button clicked', () => {
    const selectedSpy = jasmine.createSpy('optionSelected');
    component.optionSelected.subscribe(selectedSpy);

    const buttons = fixture.debugElement.queryAll(By.css('.answer-btn'));
    (buttons[0].nativeElement as HTMLButtonElement).click();

    expect(selectedSpy).toHaveBeenCalledWith('20%');
  });
});
