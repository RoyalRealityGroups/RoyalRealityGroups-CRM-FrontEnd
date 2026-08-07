/**
 * Alert Trigger (AlertConfig) types
 */

export interface AlertTrigger {
  id: number;
  code?: string;
  screen: ContentTypeInfo | null;
  screen_id?: number;
  event_type: number | null;
  event_type_name: string;
  sender_type: number | null;
  sender_type_name: string;
  type: number | null;
  type_name: string;
  message_priority: number | null;
  message_priority_name: string;
  notification_type: number | null;
  notification_type_name: string;
  frequency: number | null;
  frequency_name: string;
  gateway: string | null;
  send_to_groups: GroupMini[];
  alert_users: AlertConfigUser[];
  value: string | null;
  variable: string | null;
  template: TemplateMini | null;
  template_id?: number;
  subject_template: TemplateMini | null;
  subject_template_id?: number;
  repeat_interval: number | null;
  start_time: string | null;
  attachment_variable: string | null;
  send_doc: boolean;
  is_scheduled: boolean;
  is_active: boolean;
  is_attachment: boolean;
}

export interface ContentTypeInfo {
  id: number;
  app_label: string;
  model: string;
}

export interface GroupMini {
  id: number;
  name: string;
}

export interface TemplateMini {
  id: number;
  code: string;
  name: string;
  message: string;
  is_active: boolean;
}

export interface AlertConfigUser {
  id?: string;
  user_type: string;
  user_identifier: string;
  dodelete?: boolean;
}

// Create/Update payload
export interface AlertTriggerPayload {
  screen_id: number;
  event_type: number;
  type: number;
  sender_type: number;
  template_id?: number;
  subject_template_id?: number;
  send_to_group_ids?: number[];
  alert_users?: AlertConfigUser[];
  value?: string;
  variable?: string;
  gateway?: string;
  message_priority?: number;
  notification_type?: number;
  is_scheduled?: boolean;
  repeat_interval?: number;
  frequency?: number;
  start_time?: string;
  attachment_variable?: string;
  send_doc?: boolean;
  is_active?: boolean;
  is_attachment?: boolean;
}

// Events metadata response
export interface EventsMetadataResponse {
  modules: ModuleInfo[];
  events: ChoiceItem[];
  channels: ChoiceItem[];
  recipient_types: ChoiceItem[];
  priorities: ChoiceItem[];
  notification_types: ChoiceItem[];
}

export interface ModuleInfo {
  app_label: string;
  name: string;
  screens: ScreenInfo[];
}

export interface ScreenInfo {
  id: number;
  model: string;
  name: string;
}

export interface ChoiceItem {
  id: number;
  name: string;
}

// List params
export interface AlertTriggerListParams {
  page?: number;
  page_size?: number;
  search?: string;
  event_type?: number;
  type?: number;
  is_active?: boolean;
  screen?: number;
}
