import {
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Component,
} from '@angular/core';
import { AngularFirestore } from 'angularfire2/firestore';
import { Observable, of, throwError, Subscription, combineLatest } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, tap, map } from 'rxjs/operators';
import { Message } from '../interfaces';
import {
  PerfectScrollbarConfigInterface,
  PerfectScrollbarComponent,
} from 'ngx-perfect-scrollbar';

@Component({
  selector: 'app-chatbox',
  templateUrl: './chatbox.component.html',
  styleUrls: ['./chatbox.component.scss'],
})
export class ChatboxComponent implements OnInit, OnDestroy {
  @ViewChild('chatPanel') chatPanel: ElementRef;
  @ViewChild(PerfectScrollbarComponent, { static: false })
  componentRef: PerfectScrollbarComponent;
  public messages: Observable<any>;
  public message = '';
  public config: PerfectScrollbarConfigInterface = {};

  private readonly COLLECTION_NAME = 'messages';
  private sendMessageSubscription: Subscription;
  private loadMessageSubscription: Subscription;
  public me = '1';
  public currentUser = '2';
  constructor(private db: AngularFirestore) {}

  ngOnInit(): void {
    const incommingMessages = this.db
      .collection(this.COLLECTION_NAME)
      .doc(this.me)
      .collection(this.currentUser)
      .valueChanges();

    const outgoingMessages = this.db
      .collection(this.COLLECTION_NAME)
      .doc(this.currentUser)
      .collection(this.me)
      .valueChanges();

    this.messages = combineLatest([incommingMessages, outgoingMessages]).pipe(
      map(([i, o]) => [...i, ...o]),
      tap(() => {
        setTimeout(() => {
          this.scrollToBottom();
        }, 1);
      })
    );
  }

  ngOnDestroy(): void {
    if (this.sendMessageSubscription) {
      this.sendMessageSubscription.unsubscribe();
    }

    if (this.loadMessageSubscription) {
      this.loadMessageSubscription.unsubscribe();
    }
  }

  public sendMessage(): Observable<boolean> {
    if (this.message.length > 0) {
      this.sendMessageSubscription = this.saveMessage()
        .pipe(
          catchError((error) => {
            console.log('send error');
            return throwError(error);
          }),
          tap(() => (this.message = '')),
          tap(() => console.log('send success!'))
        )
        .subscribe();
    }

    return of(false);
  }

  private saveMessage(): Observable<void> {
    const moment = new Date();
    return new Observable<void>((subscriber) => {
      this.db
        .collection(this.COLLECTION_NAME)
        .doc(this.currentUser)
        .collection(this.me)
        .add({
          senderId: this.me,
          content: this.message,
          at: moment,
          attachment: '',
          read: false,
          receiverId: this.currentUser,
        } as Message)
        .then(() => {
          subscriber.next();
          subscriber.complete();
        })
        .catch((err) => subscriber.error(err));
    });
  }

  public scrollToBottom(): void {
    if (this.componentRef && this.componentRef.directiveRef) {
      this.componentRef.directiveRef.scrollToBottom();
    }
  }
}
