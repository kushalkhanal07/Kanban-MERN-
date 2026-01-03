import { useState, useCallback, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { Task, ColumnId, COLUMNS } from '@/types/kanban';
import { taskApi } from '@/services/api';
import { KanbanColumn } from './KanbanColumn';
import { TaskDialog } from './TaskDialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Helper function to normalize MongoDB task data
const normalizeTask = (task: any): Task => {
  return {
    id: task._id || task.id,
    title: task.title,
    description: task.description,
    columnId: task.columnId,
    position: task.position || 0,
    createdAt: task.createdAt ? new Date(task.createdAt).getTime() : Date.now()
  };
};

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultColumnId, setDefaultColumnId] = useState<ColumnId>('todo');
  const [loading, setLoading] = useState(true);

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const fetchedTasks = await taskApi.getAllTasks();
      // Normalize tasks to ensure consistent IDs
      const normalizedTasks = fetchedTasks.map(normalizeTask);
      setTasks(normalizedTasks);
    } catch (error) {
      toast.error('Failed to fetch tasks');
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTasksByColumn = useCallback((columnId: ColumnId) => {
    return tasks
      .filter((task) => task.columnId === columnId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [tasks]);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    try {
      // Find the task being dragged
      const task = tasks.find(t => t.id === draggableId);
      if (!task) return;

      // Calculate new position
      const sourceColumnTasks = tasks.filter(t => t.columnId === source.droppableId)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
      const destColumnTasks = tasks.filter(t => t.columnId === destination.droppableId)
        .sort((a, b) => (a.position || 0) - (b.position || 0));

      // Remove from source column
      const updatedTasks = tasks.map(t => {
        if (t.columnId === source.droppableId && t.position > task.position) {
          return { ...t, position: t.position - 1 };
        }
        return t;
      });

      // Adjust destination column positions
      if (source.droppableId !== destination.droppableId) {
        updatedTasks.forEach(t => {
          if (t.columnId === destination.droppableId && t.position >= destination.index) {
            t.position += 1;
          }
        });
      } else {
        // Same column, adjust positions between old and new position
        if (destination.index > source.index) {
          updatedTasks.forEach(t => {
            if (t.columnId === source.droppableId &&
              t.id !== draggableId &&
              t.position > source.index &&
              t.position <= destination.index) {
              t.position -= 1;
            }
          });
        } else {
          updatedTasks.forEach(t => {
            if (t.columnId === source.droppableId &&
              t.id !== draggableId &&
              t.position >= destination.index &&
              t.position < source.index) {
              t.position += 1;
            }
          });
        }
      }

      // Update the dragged task
      const updatedTask = {
        ...task,
        columnId: destination.droppableId as ColumnId,
        position: destination.index
      };

      // Remove old task and add updated task
      const filteredTasks = updatedTasks.filter(t => t.id !== draggableId);
      const finalTasks = [...filteredTasks, updatedTask];

      // Sort by column and position
      finalTasks.sort((a, b) => {
        if (a.columnId !== b.columnId) return a.columnId.localeCompare(b.columnId);
        return (a.position || 0) - (b.position || 0);
      });

      // Optimistically update UI
      setTasks(finalTasks);

      // Send update to backend
      await taskApi.moveTask(draggableId, {
        columnId: destination.droppableId,
        position: destination.index,
        sourceColumnId: source.droppableId,
      });

      toast.success('Task moved successfully');

    } catch (error) {
      toast.error('Failed to move task');
      console.error('Error moving task:', error);
      // Revert by fetching fresh data
      fetchTasks();
    }
  }, [tasks]);

  const handleAddTask = useCallback((columnId: ColumnId) => {
    setEditingTask(null);
    setDefaultColumnId(columnId);
    setDialogOpen(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    console.log('Editing task:', task);
    setEditingTask(task);
    setDefaultColumnId(task.columnId);
    setDialogOpen(true);
  }, []);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await taskApi.deleteTask(taskId);
      // Update UI immediately
      setTasks(prevTasks => prevTasks.filter((t) => t.id !== taskId));
      toast.success('Task deleted successfully');
    } catch (error) {
      toast.error('Failed to delete task');
      console.error('Error deleting task:', error);
    }
  }, []);

  const handleSaveTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => {
    try {
      if (taskData.id) {
        // Update existing task
        const updatedTask = await taskApi.updateTask(taskData.id, {
          title: taskData.title,
          description: taskData.description,
          columnId: taskData.columnId,
        });

        // Normalize the updated task
        const normalizedTask = normalizeTask(updatedTask);

        // Update in state
        setTasks(prevTasks =>
          prevTasks.map((t) =>
            t.id === taskData.id ? normalizedTask : t
          )
        );
        toast.success('Task updated successfully');
      } else {
        // Create new task
        const newTask = await taskApi.createTask({
          title: taskData.title,
          description: taskData.description,
          columnId: taskData.columnId,
        });

        // Normalize the new task
        const normalizedTask = normalizeTask(newTask);

        // Add to state
        setTasks(prevTasks => [...prevTasks, normalizedTask]);
        toast.success('Task created successfully');
      }
      setDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving task:', error);
      toast.error(taskData.id ? 'Failed to update task' : 'Failed to create task');
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Kanban Board</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Total Tasks: {tasks.length} | Drag and drop to organize
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={fetchTasks}
                className="gap-2"
              >
                Refresh
              </Button>
              <Button onClick={() => handleAddTask('todo')} className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Task</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={getTasksByColumn(column.id)}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
              />
            ))}
          </div>
        </DragDropContext>
      </main>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        defaultColumnId={defaultColumnId}
        onSave={handleSaveTask}
      />
    </div>
  );
}