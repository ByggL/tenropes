export type LoginResponse = {
  token: string;
  admin: boolean;
};

export type ExtendSessionResponse = LoginResponse;

export type UserMetadata = {
  username: string;
  display_name: string;
  img: string;
  status: string;
};

export type NewChannelData = {
  name: string;
  img: string;
};

export type ChannelData = {
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
