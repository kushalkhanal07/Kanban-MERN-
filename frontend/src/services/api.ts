import axios from "axios";
import { Task } from "@/types/kanban";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // Hardcode for testing
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Task API calls
export const taskApi = {
  // Get all tasks
  getAllTasks: async () => {
    const response = await api.get("/tasks");
    return response.data.data;
  },

  // Get tasks by column
  getTasksByColumn: async (columnId: string) => {
    const response = await api.get(`/tasks/column/${columnId}`);
    return response.data.data;
  },

  // Get single task
  getTask: async (id: string) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data.data;
  },

  // Create new task
  createTask: async (taskData: Omit<Task, "id" | "createdAt">) => {
    const response = await api.post("/tasks", taskData);
    return response.data.data;
  },

  // Update task
  updateTask: async (id: string, taskData: Partial<Task>) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data.data;
  },

  // Move task (drag and drop)
  moveTask: async (
    id: string,
    data: { columnId: string; position: number; sourceColumnId?: string }
  ) => {
    const response = await api.patch(`/tasks/${id}/move`, data);
    return response.data.data;
  },

  // Delete task
  deleteTask: async (id: string) => {
    await api.delete(`/tasks/${id}`);
  },

  // Delete all tasks
  deleteAllTasks: async () => {
    await api.delete("/tasks");
  },
};

// Column API calls
export const columnApi = {
  // Get all columns
  getAllColumns: async () => {
    const response = await api.get("/columns");
    return response.data.data;
  },

  // Get single column
  getColumn: async (id: string) => {
    const response = await api.get(`/columns/${id}`);
    return response.data.data;
  },

  // Update column
  updateColumn: async (
    id: string,
    data: { title?: string; taskOrder?: string[] }
  ) => {
    const response = await api.put(`/columns/${id}`, data);
    return response.data.data;
  },
};

// Health check
export const checkHealth = async () => {
  try {
    const response = await api.get("/health");
    return response.data;
  } catch (error) {
    console.error("Backend health check failed:", error);
    throw error;
  }
};
