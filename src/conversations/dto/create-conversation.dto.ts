export class CreateConversationDto {
  participants: string[]; // IDs des utilisateurs
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
}
