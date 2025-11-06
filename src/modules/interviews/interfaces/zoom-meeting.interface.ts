export interface ZoomTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface ZoomMeetingResponse {
  id: string;
  topic: string;
  start_time: string;
  duration: number;
  start_url: string;
  join_url: string;
  password: string;
  timezone?: string;
  agenda?: string;
  created_at?: string;
  host_id?: string;
}

export interface ZoomMeetingSettings {
  host_video: boolean;
  participant_video: boolean;
  join_before_host: boolean;
  mute_upon_entry: boolean;
  waiting_room: boolean;
  audio: string;
  auto_recording?: string;
}

export interface CreateZoomMeetingRequest {
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  timezone: string;
  settings: ZoomMeetingSettings;
}
