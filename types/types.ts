export type LoginResponse = {
  access_token: string;
  refresh_token: string;
};

export type ExtendSessionResponse = LoginResponse;

export type UserMetadata = {
  username: string;
  display_name: string;
  img: string;
  status: string;
};

export type Theme = {
  primary_color: string;
  primary_color_dark: string;
  accent_color: string;
  text_color: string;
  accent_text_color: string;
};

export type NewChannelData = {
  name: string;
  img: string;
  theme?: Theme; // Made optional for backward compatibility
};

export type ChannelMetadata = {
  id: number;
  name: string;
  img: string;
  creator: string;
  theme: {
    primary_color: string;
    primary_color_dark: string;
    accent_color: string;
    text_color: string;
    accent_text_color: string;
  };
  users: string[];
};

export type ChannelUpdateMetadata = {
  name: string;
  img: string;
  theme: {
    primary_color: string;
    primary_color_dark: string;
    accent_color: string;
    text_color: string;
    accent_text_color: string;
  };
};

export type MessageMetadata = {
  channel_id: number;
  timestamp: number;
  author: string;
  content: {
    type: string;
    value: string;
  };
};

export type ModifiedMessageMetadata = {
  author: {
    id: number;
    username: string;
  };
  authorId: number;
  channel_id: number;
  content: string;
  createdAt: string;
  id: number;
  type: string;
};
export type NewMessageData = {
  type: string;
  content: string;
};

export type NotificationData = {
  title: string;
  body: string;
};
