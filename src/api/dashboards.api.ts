import apiClient from './axios.config';

// export interface Dashboard {
//   id: string;
//   name: string;
//   description?: string;
//   is_default: boolean;
//   widgets?: DashboardWidget[];
// }

export interface DashboardRole {
  id: string
  dashboard: string
  dashboard_name: string
  role: string
  role_name: string
  group?: string
  group_name?: string
  display_order: number
  is_default: boolean
  can_customize: boolean
  created_at: string
  updated_at: string
}

export interface DashboardListItem {
  id: string
  name: string
  description: string
  slug: string
  icon: string
  visibility: 'private' | 'role' | 'organization'
  is_default: boolean
  is_system: boolean
  display_order: number
  widget_count: number
  created_by: string | null
  created_by_name: string | null
  created_at: string
  updated_at: string
}
export interface Dashboard {
  id: string
  name: string
  description: string
  slug: string
  icon: string
  visibility: 'private' | 'role' | 'organization'
  layout_config: Record<string, any>
  is_default: boolean
  is_system: boolean
  display_order: number
  theme: string
  refresh_interval: number
  widgets?: DashboardWidget[]
  role_assignments?: DashboardRole[]
  group_assignments?: DashboardRole[]
  widget_count: number
  created_by: string | null
  created_by_name: string | null
  created_at: string
  updated_at: string
}
export interface DashboardWidget {
  id: string;
  widget_type_code: string;
  title: string;
  subtitle?: string;
  data_source?: string;
  filters?: Record<string, any>;
  config?: Record<string, any>;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  is_visible: boolean;
}

export interface WidgetFilters {
  project_id?: string;
  date_range?: string;
  start_date?: string;
  end_date?: string;
  status?: string[];
  priority?: string[];
  limit?: number;
  assigned_to_me?: boolean;
}

export interface WidgetType {
  id: string
  name: string
  code: string
  description: string
  category: 'stats' | 'chart' | 'table' | 'list' | 'custom'
  icon: string
  component_name: string
  default_config: Record<string, any>
  available_data_sources: string[]
  min_width: number
  min_height: number
  max_width: number
  max_height: number
  default_width: number
  default_height: number
  is_system: boolean
  display_order: number
}

export interface WidgetLayout {
  id: string
  x: number
  y: number
  w: number
  h: number
}

export const widgetTypesApi = {
  list: async (params?: { category?: string }) => {
    const response = await apiClient.get<{ success: boolean; data: WidgetType[] }>(
      '/api/dashboards/widget-types/',
      { params }
    )
    return response.data
  },

  get: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: WidgetType }>(
      `/api/dashboards/widget-types/${id}/`
    )
    return response.data
  },

  create: async (data: Partial<WidgetType>) => {
    const response = await apiClient.post<{ success: boolean; data: WidgetType; message: string }>(
      '/api/dashboards/widget-types/',
      data
    )
    return response.data
  },

  update: async (id: string, data: Partial<WidgetType>) => {
    const response = await apiClient.patch<{ success: boolean; data: WidgetType; message: string }>(
      `/api/dashboards/widget-types/${id}/`,
      data
    )
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/api/dashboards/widget-types/${id}/`
    )
    return response.data
  },
}


export const dashboardsApi = {
  list: async (params?: { page?: number; page_size?: number }) => {
    const response = await apiClient.get<{ success: boolean; data: DashboardListItem[] }>(
      '/api/dashboards/dashboards/',
      { params }
    );
    return response.data;
  },

  get: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: Dashboard }>(
      `/api/dashboards/dashboards/${id}/`
    );
    return response.data;
  },

  getDefault: async () => {
    const response = await apiClient.get<{ success: boolean; data: Dashboard }>(
      '/api/dashboards/dashboards/my-dashboards/'
    );
    return response.data;
  },

  create: async (data: {
    name: string;
    description?: string;
    icon?: string;
    visibility?: 'private' | 'role' | 'organization';
  }) => {
    const response = await apiClient.post<{ success: boolean; data: Dashboard; message: string }>(
      '/api/dashboards/dashboards/',
      data
    );
    return response.data;
  },

  duplicate: async (id: string) => {
    const response = await apiClient.post<{ success: boolean; data: Dashboard; message: string }>(
      `/api/dashboards/dashboards/${id}/duplicate/`
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/api/dashboards/dashboards/${id}/`
    );
    return response.data;
  },
};

export const dashboardRolesApi = {
  list: async (params?: { dashboard?: string; group?: string }) => {
    const response = await apiClient.get<{ success: boolean; data: DashboardRole[] }>(
      '/api/dashboards/group-assignments/',
      { params }
    )
    return response.data
  },

  create: async (data: {
    dashboard: string
    group: string
    display_order?: number
    is_default?: boolean
    can_customize?: boolean
  }) => {
    const response = await apiClient.post<{ success: boolean; data: DashboardRole; message: string }>(
      '/api/dashboards/group-assignments/',
      data
    )
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      '/api/dashboards/group-assignments/${id}/'
    )
    return response.data
  },

  // Bulk assign dashboards to a role
  bulkAssign: async (roleId: string, dashboardIds: string[]) => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/api/dashboards/group-assignments/bulk_assign/',
      { role_id: roleId, dashboard_ids: dashboardIds }
    )
    return response.data
  },
}


export const dashboardWidgetsApi = {
  list: async (dashboardId: string) => {
    const response = await apiClient.get<{ success: boolean; data: DashboardWidget[] }>(
      '/api/dashboards/widgets/',
      { params: { dashboard: dashboardId } }
    )
    return response.data
  },

  get: async (id: string) => {
    const response = await apiClient.get<{ success: boolean; data: DashboardWidget }>(
      `/api/dashboards/widgets/${id}/`
    )
    return response.data
  },

  create: async (data: {
    dashboard: string
    widget_type: string
    title: string
    subtitle?: string
    position_x?: number
    position_y?: number
    width?: number
    height?: number
    config?: Record<string, any>
    data_source?: string
    filters?: Record<string, any>
    style?: Record<string, any>
    cache_duration?: number
    is_visible?: boolean
  }) => {
    const response = await apiClient.post<{ success: boolean; data: DashboardWidget; message: string }>(
      '/api/dashboards/widgets/',
      data
    )
    return response.data
  },

  update: async (id: string, data: Partial<DashboardWidget>) => {
    const response = await apiClient.patch<{ success: boolean; data: DashboardWidget; message: string }>(
      `/api/dashboards/widgets/${id}/`,
      data
    )
    return response.data
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/api/dashboards/widgets/${id}/`
    )
    return response.data
  },

  // Bulk update widget layouts
  updateLayout: async (dashboardId: string, layouts: WidgetLayout[]) => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/api/dashboards/widgets/bulk-update-layout/',
      { dashboard_id: dashboardId, layouts }
    )
    return response.data
  },
}

export const widgetDataApi = {
  fetch: async (dataSource: string, filters?: WidgetFilters) => {
    const response = await apiClient.get(`/api/dashboards/widgets/data/${dataSource}/`, {
      params: filters,
    });
    return { success: true, data: response.data };
  },
};
/**
 * Todo API Service
 *
 * Handles API calls for todo management including todos, categories,
 * comments, and attachments.
 */


// ============================================
// Types
// ============================================

export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface TodoCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
  is_default: boolean;
  is_active: boolean;
  todo_count?: number;
  created_at: string;
  updated_at: string;
}

export interface TodoCategoryListItem {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface Todo {
  id: string;
  title: string;
  description: string;
  status: TodoStatus;
  status_display: string;
  priority: TodoPriority;
  priority_display: string;
  category: string | null;
  category_name: string | null;
  category_color: string | null;
  tags: string[];
  due_date: string | null;
  due_time: string | null;
  start_date: string | null;
  completed_at: string | null;
  created_by: string;
  created_by_name: string;
  created_by_email: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  assigned_to_email: string | null;
  is_private: boolean;
  reminder_enabled: boolean;
  reminder_datetime: string | null;
  reminder_sent: boolean;
  recurrence: RecurrenceType;
  recurrence_display: string;
  recurrence_end_date: string | null;
  parent: string | null;
  order: number;
  progress: number;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  project: string | null;
  project_name: string | null;
  task: string | null;
  task_title: string | null;
  notes: string;
  is_pinned: boolean;
  is_starred: boolean;
  is_overdue: boolean;
  is_due_today: boolean;
  subtask_count: number;
  completed_subtask_count: number;
  comment_count: number;
  attachment_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TodoListItem {
  id: string;
  title: string;
  status: TodoStatus;
  status_display: string;
  priority: TodoPriority;
  priority_display: string;
  category: string | null;
  category_name: string | null;
  category_color: string | null;
  due_date: string | null;
  due_time: string | null;
  created_by: string;
  created_by_name: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  is_pinned: boolean;
  is_starred: boolean;
  is_private: boolean;
  progress: number;
  is_overdue: boolean;
  is_due_today: boolean;
  subtask_count: number;
  completed_subtask_count: number;
  created_at: string;
  updated_at: string;
}

export interface TodoDetail extends Todo {
  subtasks: TodoListItem[];
  comments: TodoComment[];
  attachments: TodoAttachment[];
}

export interface TodoComment {
  id: string;
  todo: string;
  author: string;
  author_name: string;
  author_email: string;
  content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TodoAttachment {
  id: string;
  todo: string;
  uploaded_by: string;
  uploaded_by_name: string;
  file: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  is_active: boolean;
  created_at: string;
}

export interface TodoStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  on_hold: number;
  overdue: number;
  due_today: number;
  starred: number;
  completion_rate: number;
}

// ============================================
// API Response Types
// ============================================

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  errors: Array<{ field: string; message: string }>;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: {
    results: T[];
    count: number;
    next: string | null;
    previous: string | null;
  };
  message: string;
  errors: Array<{ field: string; message: string }>;
}

// ============================================
// Todo API
// ============================================

export const todosApi = {
  /**
   * List todos with optional filters
   */
  list: async (params?: {
    page?: number;
    page_size?: number;
    status?: TodoStatus;
    priority?: TodoPriority;
    category?: string;
    assigned_to?: string;
    created_by?: string;
    is_pinned?: boolean;
    is_starred?: boolean;
    is_private?: boolean;
    due_date_from?: string;
    due_date_to?: string;
    project?: string;
    task?: string;
    search?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<TodoListItem>> => {
    const response = await apiClient.get('/todos/', { params });
    return response.data;
  },

  /**
   * Get a single todo by ID
   */
  get: async (id: string): Promise<ApiResponse<TodoDetail>> => {
    const response = await apiClient.get(`/todos/${id}/`);
    return response.data;
  },

  /**
   * Create a new todo
   */
  create: async (data: Partial<Todo>): Promise<ApiResponse<Todo>> => {
    const response = await apiClient.post('/todos/', data);
    return response.data;
  },

  /**
   * Update a todo
   */
  update: async (id: string, data: Partial<Todo>): Promise<ApiResponse<Todo>> => {
    const response = await apiClient.patch(`/todos/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a todo (soft delete)
   */
  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/todos/${id}/`);
    return response.data;
  },

  /**
   * Mark a todo as complete
   */
  complete: async (id: string): Promise<ApiResponse<Todo>> => {
    const response = await apiClient.post(`/todos/${id}/complete/`);
    return response.data;
  },

  /**
   * Mark a todo as incomplete
   */
  incomplete: async (id: string): Promise<ApiResponse<Todo>> => {
    const response = await apiClient.post(`/todos/${id}/incomplete/`);
    return response.data;
  },

  /**
   * Bulk update multiple todos
   */
  bulkUpdate: async (data: {
    ids: string[];
    status?: TodoStatus;
    priority?: TodoPriority;
    category?: string | null;
    assigned_to?: string | null;
    due_date?: string | null;
    is_pinned?: boolean;
    is_starred?: boolean;
  }): Promise<ApiResponse<{ updated_count: number }>> => {
    const response = await apiClient.post('/todos/bulk-update/', data);
    return response.data;
  },

  /**
   * Reorder todos
   */
  reorder: async (items: Array<{ id: string; order: number }>): Promise<ApiResponse<null>> => {
    const response = await apiClient.post('/todos/reorder/', { items });
    return response.data;
  },

  /**
   * Get current user's todos
   */
  myTodos: async (params?: {
    page?: number;
    page_size?: number;
    status?: TodoStatus;
  }): Promise<PaginatedResponse<TodoListItem>> => {
    const response = await apiClient.get('/todos/my-todos/', { params });
    return response.data;
  },

  /**
   * Get todos due today
   */
  today: async (): Promise<ApiResponse<TodoListItem[]>> => {
    const response = await apiClient.get('/todos/today/');
    return response.data;
  },

  /**
   * Get overdue todos
   */
  overdue: async (): Promise<ApiResponse<TodoListItem[]>> => {
    const response = await apiClient.get('/todos/overdue/');
    return response.data;
  },

  /**
   * Get upcoming todos (next 7 days)
   */
  upcoming: async (): Promise<ApiResponse<TodoListItem[]>> => {
    const response = await apiClient.get('/todos/upcoming/');
    return response.data;
  },

  /**
   * Get todo statistics
   */
  stats: async (): Promise<ApiResponse<TodoStats>> => {
    const response = await apiClient.get('/todos/stats/');
    return response.data;
  },
};

// ============================================
// Todo Categories API
// ============================================

export const todoCategoriesApi = {
  /**
   * List all categories
   */
  list: async (): Promise<ApiResponse<TodoCategoryListItem[]>> => {
    const response = await apiClient.get('/todo-categories/');
    return response.data;
  },

  /**
   * Get a single category
   */
  get: async (id: string): Promise<ApiResponse<TodoCategory>> => {
    const response = await apiClient.get(`/todo-categories/${id}/`);
    return response.data;
  },

  /**
   * Create a new category
   */
  create: async (data: Partial<TodoCategory>): Promise<ApiResponse<TodoCategory>> => {
    const response = await apiClient.post('/todo-categories/', data);
    return response.data;
  },

  /**
   * Update a category
   */
  update: async (id: string, data: Partial<TodoCategory>): Promise<ApiResponse<TodoCategory>> => {
    const response = await apiClient.patch(`/todo-categories/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a category (soft delete)
   */
  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/todo-categories/${id}/`);
    return response.data;
  },
};

// ============================================
// Todo Comments API
// ============================================

export const todoCommentsApi = {
  /**
   * List comments for a todo
   */
  list: async (todoId: string): Promise<ApiResponse<TodoComment[]>> => {
    const response = await apiClient.get('/todo-comments/', { params: { todo: todoId } });
    return response.data;
  },

  /**
   * Create a comment
   */
  create: async (data: { todo: string; content: string }): Promise<ApiResponse<TodoComment>> => {
    const response = await apiClient.post('/todo-comments/', data);
    return response.data;
  },

  /**
   * Update a comment
   */
  update: async (id: string, content: string): Promise<ApiResponse<TodoComment>> => {
    const response = await apiClient.patch(`/todo-comments/${id}/`, { content });
    return response.data;
  },

  /**
   * Delete a comment (soft delete)
   */
  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/todo-comments/${id}/`);
    return response.data;
  },
};

// ============================================
// Todo Attachments API
// ============================================

export const todoAttachmentsApi = {
  /**
   * List attachments for a todo
   */
  list: async (todoId: string): Promise<ApiResponse<TodoAttachment[]>> => {
    const response = await apiClient.get('/todo-attachments/', { params: { todo: todoId } });
    return response.data;
  },

  /**
   * Upload an attachment
   */
  upload: async (data: { todo: string; file: File; mime_type?: string }): Promise<ApiResponse<TodoAttachment>> => {
    const formData = new FormData();
    formData.append('todo', data.todo);
    formData.append('file', data.file);
    if (data.mime_type) {
      formData.append('mime_type', data.mime_type);
    }

    const response = await apiClient.post('/todo-attachments/', formData);
    return response.data;
  },

  /**
   * Delete an attachment (soft delete)
   */
  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete(`/todo-attachments/${id}/`);
    return response.data;
  },
};

export default {
  todos: todosApi,
  categories: todoCategoriesApi,
  comments: todoCommentsApi,
  attachments: todoAttachmentsApi,
};
