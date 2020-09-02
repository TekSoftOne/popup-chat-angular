import { OnInit, Component } from '@angular/core';

@Component({
  selector: 'app-tekchat',
  template: `<app-chatbox></app-chatbox>`,
})
export class RootComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
