import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'ordinal',
  standalone: true,
})
export class OrdinalPipe implements PipeTransform {
  transform(value: number): string {
    if (!Number.isInteger(value) || value < 0) {
      return String(value);
    }

    const abs = Math.abs(value);
    const mod100 = abs % 100;
    const mod10 = abs % 10;

    // Special case for 11th, 12th, 13th
    if (mod100 >= 11 && mod100 <= 13) {
      return `${value}th`;
    }

    switch (mod10) {
      case 1: return `${value}st`;
      case 2: return `${value}nd`;
      case 3: return `${value}rd`;
      default: return `${value}th`;
    }
  }
}
