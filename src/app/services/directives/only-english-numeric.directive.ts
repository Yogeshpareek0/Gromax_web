import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: 'input:not([type=checkbox]):not([type=radio]), textarea',
  standalone: true 
})
export class OnlyEnglishNumericDirective {

  @HostListener('input', ['$event'])
  onInput(event: any) {
    const input = event.target;
    const cleanedValue = input.value.replace(/[^A-Za-z0-9\s]/g, '');
    if (input.value !== cleanedValue) {
      input.value = cleanedValue;
      event.stopPropagation();
    }
  }
}
