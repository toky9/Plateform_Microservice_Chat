export class ConversationParticipantDto {
  id: string; // userId métier
  name: string;
  avatarUrl?: string;
  status?: string;
}

export class CreateConversationDto {
  participants: ConversationParticipantDto[];
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
}
