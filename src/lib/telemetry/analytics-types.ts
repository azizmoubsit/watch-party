export interface UserAnalyticsSummary {
  userId: string;
  displayName: string;
  role: string;
  totalWatchTimeSeconds: number;
  sessionCount: number;
  joinedAt: string;
  lastSeenAt: string;
}

export interface RoomAnalytics {
  roomId: string;
  title: string;
  code: string;
  createdAt: string;
  updatedAt: string;
  totalParticipants: number;
  currentOnlineCount: number;
  totalWatchTimeSeconds: number;
  avgSessionDurationSeconds: number;
  totalSessions: number;
  userSummaries: UserAnalyticsSummary[];
}
