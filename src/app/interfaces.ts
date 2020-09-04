export interface Message {
  content: string;
  at: Date;
  read: boolean;
  attachment: string;
}

export interface SessionProps {
  agentGUID: string;
  userGUID: string;
}
