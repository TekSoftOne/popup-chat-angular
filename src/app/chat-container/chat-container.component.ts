import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { Message, SessionProps, ActiveAgent } from '../interfaces';
import {
  PerfectScrollbarComponent,
  PerfectScrollbarConfigInterface,
} from 'ngx-perfect-scrollbar';
import {
  Observable,
  Subscription,
  combineLatest,
  throwError,
  of,
  pipe,
} from 'rxjs';
import { AngularFirestore, DocumentData } from 'angularfire2/firestore';
import { map, tap, catchError, switchMap, concatMap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-chat-container',
  templateUrl: './chat-container.component.html',
  styleUrls: ['./chat-container.component.scss'],
})
export class ChatContainerComponent implements OnInit, OnDestroy {
  @ViewChild('chatPanel') chatPanel: ElementRef;
  @ViewChild(PerfectScrollbarComponent, { static: false })
  componentRef: PerfectScrollbarComponent;

  public messages: Observable<any>;
  public message = '';
  public config: PerfectScrollbarConfigInterface = {};

  private readonly CLIENT_GUID = '9245fe4a-d402-451c-b9ed-9c1a04247482';
  private readonly TOKEN_NAME = 'TEK_USER_SESSION';

  private sendMessageSubscription: Subscription;
  private loadMessageSubscription: Subscription;
  private sessionProsSubscription: Subscription;
  private activeAgentSubscription: Subscription;

  private readonly userSession$: Observable<string>;
  private readonly activeAgents$: Observable<ActiveAgent>;
  public sessionProps: SessionProps;

  constructor(private db: AngularFirestore) {
    this.userSession$ = this.getUserSession();
    this.activeAgents$ = this.getActiveAgent();
    this.activeAgents$.subscribe();

    const sessionProps$ = combineLatest([
      this.userSession$,
      this.activeAgents$,
    ]).pipe(
      map(([userGUID, agent]) => {
        return {
          userGUID,
          agentGUID: agent.guid,
          agentName: agent.name,
        } as SessionProps;
      }),
      tap((s) => (this.sessionProps = s))
    );

    this.sessionProsSubscription = sessionProps$.subscribe();

    this.messages = sessionProps$.pipe(
      switchMap((session) => {
        if (session.agentGUID === '' || session.userGUID === '') {
          return of([]);
        }

        const incommingMessages = this.db
          .collection('clients')
          .doc('messages')
          .collection(this.CLIENT_GUID)
          .doc(session.userGUID)
          .collection(session.agentGUID)
          .valueChanges();

        const outcomingMessages = this.db
          .collection('clients')
          .doc('messages')
          .collection(this.CLIENT_GUID)
          .doc(session.agentGUID)
          .collection(session.userGUID)
          .valueChanges();

        return combineLatest([incommingMessages, outcomingMessages]).pipe(
          map(([i, o]) => {
            const messages = [...i, ...o] as Message[];
            return messages.sort((m1, m2) => {
              if (m1.at > m2.at) {
                return 1;
              } else if (m1.at < m2.at) {
                return -1;
              }
              return 0;
            });
          }),
          tap(() => setTimeout(() => this.scrollToBottom(), 1))
        );
      })
    );
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    if (this.sendMessageSubscription) {
      this.sendMessageSubscription.unsubscribe();
    }

    if (this.loadMessageSubscription) {
      this.loadMessageSubscription.unsubscribe();
    }

    if (this.sessionProsSubscription) {
      this.sessionProsSubscription.unsubscribe();
    }

    if (this.activeAgentSubscription) {
      this.activeAgentSubscription.unsubscribe();
    }
  }

  private registerUserSession(): Observable<string> {
    return this.registerToDatabase().pipe(
      catchError((error) => {
        return throwError(error);
      }),
      tap((guid) => this.registerToLocalStorage(guid))
    );
  }

  private getActiveAgent(): Observable<ActiveAgent> {
    return this.db
      .collection('clients')
      .doc('activeAgents')
      .collection(this.CLIENT_GUID)
      .valueChanges()
      .pipe(
        tap((data) => {
          // console.log(data);
        }),
        map((agents) => ({
          guid: agents[0].guid,
          name: agents[0].name,
          lastAccess: agents[0].lastAccess,
          lastMessage: agents[0].lastMessage,
        }))
      );
  }

  private getUserSession(): Observable<string> {
    const guid = localStorage.getItem(this.TOKEN_NAME);
    if (!guid) {
      return this.registerUserSession();
    }

    return of(guid);
  }

  private registerToLocalStorage(userGuid: string): void {
    localStorage.setItem(this.TOKEN_NAME, userGuid);
  }

  private getUserGUID(): string {
    return localStorage.getItem(this.TOKEN_NAME);
  }

  private registerToDatabase(): Observable<string> {
    const guid = uuidv4();
    // '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'

    return new Observable((observer) => {
      this.db
        .collection('clients')
        .doc('activeUsers')
        .collection(this.CLIENT_GUID)
        .doc(guid)
        .set({
          guid,
          lastAccess: new Date(),
          lastMessage: '',
        })
        .then(() => {
          observer.next(guid);
          observer.complete();
        })
        .catch((err) => observer.error(err));
    });
  }

  public sendMessage(): Observable<boolean> {
    if (this.message.length > 0) {
      this.sendMessageSubscription = this.saveMessage()
        .pipe(
          catchError((error) => {
            // console.log('send error');
            return throwError(error);
          }),
          tap(() => this.saveLastAccess()),
          tap(() => (this.message = '')),
          tap(() => console.log('send success!'))
        )
        .subscribe();
    }

    return of(false);
  }

  private getCurrentAgentGUID(): string {
    return 'something';
  }

  private saveLastAccess(): void {
    this.db
      .collection('clients')
      .doc('activeUsers')
      .collection(this.CLIENT_GUID)
      .doc(this.sessionProps.userGUID)
      .update({
        guid: this.sessionProps.userGUID,
        lastAccess: new Date(),
        lastMessage: this.message,
      });
    console.log('last access:' + new Date());
  }

  private saveMessage(): Observable<void> {
    if (this.getCurrentAgentGUID() !== '' && this.getUserGUID() !== '') {
      const moment = new Date();
      return new Observable<void>((subscriber) => {
        this.db
          .collection('clients')
          .doc('messages')
          .collection(this.CLIENT_GUID)
          .doc(this.sessionProps.userGUID)
          .collection(this.sessionProps.agentGUID)
          .add({
            senderId: this.sessionProps.userGUID,
            content: this.message,
            at: moment,
            attachment: '',
            read: false,
            receiverId: this.sessionProps.agentGUID,
          } as Message)
          .then(() => {
            subscriber.next();
            subscriber.complete();
          })
          .catch((err) => subscriber.error(err));
      });
    }
  }

  public scrollToBottom(): void {
    if (this.componentRef && this.componentRef.directiveRef) {
      this.componentRef.directiveRef.scrollToBottom();
    }
  }
}
