export enum MessageRole {
  USER = 'USER',
  ASSISTANCE = 'ASSISTANCE',
}

export enum MessageType {
  RESULT = 'RESULT',
  ERROR = 'ERROR',
}

export interface Message {
  id: string;
  content: string;
  role: 'USER' | 'ASSISTANCE';
  type: 'RESULT' | 'ERROR';
  createdAt: string;
  updatedAt: string;
  projectId: string;
  fragment?: Fragment | null;
}

export interface Fragment {
  id: string;
  messageId: string;
  sandboxUrl: string;
  title: string;
  file: any; 
  createdAt: string;
  updatedAt: string;
}
