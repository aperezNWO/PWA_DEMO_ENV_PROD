import { Component, Input, Output, EventEmitter } from '@angular/core';

//
@Component({
    selector: 'app-square',
    imports: [],
    templateUrl: './square.component.html',
    styleUrls: ['./square.component.css']
})
//
export class SquareComponent {
  //
  @Input() value: 'X' | 'O' | null = null;
  @Output() clickEvent = new EventEmitter<void>();
  //
  onClick(): void {
    this.clickEvent.emit();
  }
}

