import { OnInit, Component, HostListener } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-chatbox',
  templateUrl: './chatbox.component.html',
  styleUrls: ['./chatbox.component.scss'],
})
export class ChatboxComponent implements OnInit {
  public isMobile$: Observable<boolean>;
  private width$: BehaviorSubject<number>;
  private mobileWidth = 760;

  public panelOpenState = false;

  constructor() {}

  ngOnInit(): void {
    this.width$ = new BehaviorSubject<number>(screen.width);
    this.isMobile$ = this.width$.pipe(map((w) => w < this.mobileWidth));
  }

  @HostListener('window:resize')
  public onResize(): void {
    this.width$.next(screen.width);
  }
}
