/**
 * Screen Settings API Service
 *
 * Handles all screen-level settings API calls
 */

import apiClient from './axios.config';
// Types
export type EstimationUnit = 'hours' | 'days' | 'story_points';

export interface TasksScreenSettings {
  id: string;
  organization: string;
  // Visibility & Access
  allow_staff_see_all_project_tasks: boolean;
  allow_customers_view_project_tasks: boolean;
  // Comment Settings
  comment_edit_time_limit_enabled: boolean;
  comment_edit_time_limit_hours: number;
  // Task Creation
  allow_task_without_project: boolean;
  require_due_date: boolean;
  require_estimation: boolean;
  default_estimation_unit: EstimationUnit;
  // Auto-Assignment
  auto_assign_creator: boolean;
  auto_set_creator_as_reporter: boolean;
  // Timer & Status
  auto_change_status_on_timer_start: boolean;
  enforce_single_in_progress: boolean;
  // Timer Safety
  max_timer_hours: number;
  idle_timeout_minutes: number;
  auto_stop_end_of_day: boolean;
  work_end_time: string;
  // Lunch Break
  lunch_break_enabled: boolean;
  lunch_start_time: string;
  lunch_end_time: string;
  lunch_dialog_timeout_minutes: number;
  // Time Tracking
  require_time_log_before_close: boolean;
  minimum_time_log_minutes: number;
  allow_time_log_on_completed: boolean;
  // Workflow
  prevent_reopen_after_days: number;
  // Default Values
  default_task_status: string;
  default_task_priority: string;
  // Weekly Plan Settings
  require_weekly_plan_submission: boolean;
  weekly_plan_submission_deadline_day: number;
  // Bulk Operations Settings
  allow_bulk_delete: boolean;
  allow_bulk_status_change: boolean;
  // Local Terminal Export
  enable_local_terminal_export: boolean;
  // AI Development Prompts
  enable_ai_dev_prompts: boolean;
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface TasksScreenSettingsUpdate {
  // Visibility & Access
  allow_staff_see_all_project_tasks?: boolean;
  allow_customers_view_project_tasks?: boolean;
  // Comment Settings
  comment_edit_time_limit_enabled?: boolean;
  comment_edit_time_limit_hours?: number;
  // Task Creation
  allow_task_without_project?: boolean;
  require_due_date?: boolean;
  require_estimation?: boolean;
  default_estimation_unit?: EstimationUnit;
  // Auto-Assignment
  auto_assign_creator?: boolean;
  auto_set_creator_as_reporter?: boolean;
  // Timer & Status
  auto_change_status_on_timer_start?: boolean;
  enforce_single_in_progress?: boolean;
  // Timer Safety
  max_timer_hours?: number;
  idle_timeout_minutes?: number;
  auto_stop_end_of_day?: boolean;
  work_end_time?: string;
  // Lunch Break
  lunch_break_enabled?: boolean;
  lunch_start_time?: string;
  lunch_end_time?: string;
  lunch_dialog_timeout_minutes?: number;
  // Time Tracking
  require_time_log_before_close?: boolean;
  minimum_time_log_minutes?: number;
  allow_time_log_on_completed?: boolean;
  // Workflow
  prevent_reopen_after_days?: number;
  // Default Values
  default_task_status?: string;
  default_task_priority?: string;
  // Weekly Plan Settings
  require_weekly_plan_submission?: boolean;
  weekly_plan_submission_deadline_day?: number;
  // Bulk Operations Settings
  allow_bulk_delete?: boolean;
  allow_bulk_status_change?: boolean;
  // Local Terminal Export
  enable_local_terminal_export?: boolean;
  // AI Development Prompts
  enable_ai_dev_prompts?: boolean;
}

export type TicketRepliesOrder = 'ascending' | 'descending';

export interface SupportScreenSettings {
  id: string;
  organization: string;
  // Services
  use_services: boolean;
  // Public Access
  disable_ticket_public_url: boolean;
  // Staff Access
  allow_staff_access_department_tickets_only: boolean;
  allow_staff_open_all_contacts: boolean;
  // Notifications
  notify_assignee_only: boolean;
  notify_on_new_ticket: boolean;
  notify_on_customer_reply: boolean;
  // Auto-Assignment
  auto_assign_first_reply: boolean;
  // Permissions
  allow_non_staff_ticket_access: boolean;
  allow_non_admin_delete_attachments: boolean;
  allow_non_admin_delete_tickets: boolean;
  // Customer Settings
  allow_customer_change_status: boolean;
  customer_show_own_tickets_only: boolean;
  // Display Settings
  ticket_replies_order: TicketRepliesOrder;
  ticket_replies_order_display?: string;
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface SupportScreenSettingsUpdate {
  // Services
  use_services?: boolean;
  // Public Access
  disable_ticket_public_url?: boolean;
  // Staff Access
  allow_staff_access_department_tickets_only?: boolean;
  allow_staff_open_all_contacts?: boolean;
  // Notifications
  notify_assignee_only?: boolean;
  notify_on_new_ticket?: boolean;
  notify_on_customer_reply?: boolean;
  // Auto-Assignment
  auto_assign_first_reply?: boolean;
  // Permissions
  allow_non_staff_ticket_access?: boolean;
  allow_non_admin_delete_attachments?: boolean;
  allow_non_admin_delete_tickets?: boolean;
  // Customer Settings
  allow_customer_change_status?: boolean;
  customer_show_own_tickets_only?: boolean;
  // Display Settings
  ticket_replies_order?: TicketRepliesOrder;
}

export interface NoticeBoardScreenSettings {
  id: string;
  is_enabled: boolean;
  show_in_topnav: boolean;
  allow_all_to_post: boolean;
  allowed_poster_roles: string[];
  auto_expire_enabled: boolean;
  auto_expire_days: number;
  max_notices_in_panel: number;
  require_acknowledgment: boolean;
  created_at: string;
  updated_at: string;
}

export interface NoticeBoardScreenSettingsUpdate {
  is_enabled?: boolean;
  show_in_topnav?: boolean;
  allow_all_to_post?: boolean;
  allowed_poster_roles?: string[];
  auto_expire_enabled?: boolean;
  auto_expire_days?: number;
  max_notices_in_panel?: number;
  require_acknowledgment?: boolean;
}

export interface GoalsScreenSettings {
  id: string;
  goals_enabled: boolean;
  allow_individual_goals: boolean;
  allow_team_goals: boolean;
  allow_department_goals: boolean;
  allow_company_goals: boolean;
  require_approval: boolean;
  max_active_goals_per_user: number;
  default_review_frequency: string;
  default_visibility: string;
  allow_custom_metrics: boolean;
  gamification_enabled: boolean;
  points_on_goal_created: number;
  points_on_goal_completed: number;
  points_on_milestone_reached: number;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors: string[];
}

// API Functions
export const screenSettingsApi = {
  // Get Tasks screen settings
  getTasksSettings: async () => {
    const response = await apiClient.get<ApiResponse<TasksScreenSettings>>('/screen-settings/tasks/');
    return response.data;
  },

  // Update Tasks screen settings
  updateTasksSettings: async (data: TasksScreenSettingsUpdate) => {
    const response = await apiClient.patch<ApiResponse<TasksScreenSettings>>('/screen-settings/tasks/', data);
    return response.data;
  },
  // Get Remote Support screen settings
  getRemoteSupportSettings: async () => {
    const response = await apiClient.get('/remote-support/screen-settings/');
    return response.data;
  },

  // Update Remote Support screen settings
  updateRemoteSupportSettings: async (data: Record<string, unknown>) => {
    const response = await apiClient.patch('/remote-support/screen-settings/', data);
    return response.data;
  },

  // Get Support screen settings
  getSupportSettings: async () => {
    const response = await apiClient.get<ApiResponse<SupportScreenSettings>>('/screen-settings/support/');
    return response.data;
  },

  // Update Support screen settings
  updateSupportSettings: async (data: SupportScreenSettingsUpdate) => {
    const response = await apiClient.patch<ApiResponse<SupportScreenSettings>>('/screen-settings/support/', data);
    return response.data;
  },

  // Get Goals screen settings
  getGoalsSettings: async () => {
    const response = await apiClient.get<ApiResponse<GoalsScreenSettings>>('/screen-settings/goals/');
    return response.data;
  },

  // Update Goals screen settings
  updateGoalsSettings: async (data: Partial<GoalsScreenSettings>) => {
    const response = await apiClient.patch<ApiResponse<GoalsScreenSettings>>('/screen-settings/goals/', data);
    return response.data;
  },

  // Get Notice Board screen settings
  getNoticeBoardSettings: async () => {
    const response = await apiClient.get<ApiResponse<NoticeBoardScreenSettings>>('/system/notice-board-settings/');
    return response.data;
  },

  // Update Notice Board screen settings
  updateNoticeBoardSettings: async (data: NoticeBoardScreenSettingsUpdate) => {
    const response = await apiClient.patch<ApiResponse<NoticeBoardScreenSettings>>('/system/notice-board-settings/', data);
    return response.data;
  },
};

export default screenSettingsApi;
