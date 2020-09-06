export interface Message {
  content: string;
  at: Date;
  read: boolean;
  attachment: string;
}

export interface SessionProps {
  agentGUID: string;
  userGUID: string;
  agentName: string;
}

export interface ActiveAgent {
  guid: string;
  name: string;
  lastAccess: any; //timestamp
  lastMessage: string;
}
