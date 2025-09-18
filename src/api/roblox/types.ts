type User = {
  description: string;
  created: string;
  isBanned: boolean;
  externalAppDisplayName: unknown;
  hasVerifiedBadge: boolean;
  id: number;
  name: string;
  displayName: string;
};

export type UsersV1Response = User;
