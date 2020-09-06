import { Component, OnInit, Input } from '@angular/core';
import { Timestamp } from 'rxjs/internal/operators/timestamp';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss'],
})
export class MessageComponent implements OnInit {
  @Input() content: string;
  @Input() type = 'outcoming'; // incoming
  @Input() at: any;
  @Input() senderId: string;
  @Input() receiverId: string;
  @Input() me: string;
  @Input() name: string;
  constructor() {}

  ngOnInit(): void {}
}
