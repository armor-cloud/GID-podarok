import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

export interface Task {
  id: number;
  title: string;
  description: string;
  points: number;
  is_completed: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  expires_at?: string | null;
  details?: string | null;
}

export interface TaskCreate {
  title: string;
  description: string;
  points: number;
  is_visible: boolean;
  expires_at?: string | null;
  details?: string | null;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  points?: number;
  is_visible?: boolean;
  is_completed?: boolean;
  expires_at?: string | null;
  details?: string | null;
}

class TaskService {
  async getAllTasks(): Promise<Task[]> {
    const response = await axios.get(`${API_URL}/tasks/`);
    return response.data;
  }

  async getVisibleTasks(): Promise<Task[]> {
    const response = await axios.get(`${API_URL}/tasks/visible/`);
    return response.data;
  }

  async createTask(task: TaskCreate): Promise<Task> {
    const response = await axios.post(`${API_URL}/tasks/`, task);
    return response.data;
  }

  async updateTask(id: number, task: TaskUpdate): Promise<Task> {
    const response = await axios.put(`${API_URL}/tasks/${id}`, task);
    return response.data;
  }

  async deleteTask(id: number): Promise<void> {
    await axios.delete(`${API_URL}/tasks/${id}`);
  }
}

export const taskService = new TaskService(); 