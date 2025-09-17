
export interface Person {
  id: string;
  name: string;
  avatarColor: string;
  status: 'claimed' | 'unclaimed';
  inviteToken?: string;
}

export interface Walk {
  id: string;
  day: string;
  timeSlot: 'Mañana' | 'Tarde' | 'Noche';
  personId: string | null;
  isCompleted: boolean;
  date: Date;
  notes?: string;
  completionTime?: string;
}

export type Schedule = Walk[];

export type View = 'schedule' | 'leaderboard';