import { useState, useCallback } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { Task, ColumnId, COLUMNS } from '@/types/kanban';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { KanbanColumn } from './KanbanColumn';
import { TaskDialog } from './TaskDialog';
import { Button } from '@/components/ui/button';

const generateId = () => `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export function KanbanBoard() {
  const [tasks, setTasks] = useLocalStorage<Task[]>('kanban-tasks', []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultColumnId, setDefaultColumnId] = useState<ColumnId>('todo');

  const getTasksByColumn = useCallback((columnId: ColumnId) => {
    return tasks
      .filter((task) => task.columnId === columnId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [tasks]);

  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    setTasks((prevTasks) => {
      const taskIndex = prevTasks.findIndex((t) => t.id === draggableId);
      if (taskIndex === -1) return prevTasks;

      const newTasks = [...prevTasks];
      const [movedTask] = newTasks.splice(taskIndex, 1);
      
      const updatedTask = {
        ...movedTask,
        columnId: destination.droppableId as ColumnId,
      };

      // Get tasks in destination column
      const destColumnTasks = newTasks.filter(
        (t) => t.columnId === destination.droppableId
      );
      
      // Find insertion point
      if (destination.index >= destColumnTasks.length) {
        newTasks.push(updatedTask);
      } else {
        const insertAfterTask = destColumnTasks[destination.index];
        const insertIndex = newTasks.findIndex((t) => t.id === insertAfterTask?.id);
        newTasks.splice(insertIndex, 0, updatedTask);
      }

      return newTasks;
    });
  }, [setTasks]);

  const handleAddTask = useCallback((columnId: ColumnId) => {
    setEditingTask(null);
    setDefaultColumnId(columnId);
    setDialogOpen(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setDefaultColumnId(task.columnId);
    setDialogOpen(true);
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((t) => t.id !== taskId));
  }, [setTasks]);

  const handleSaveTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt'> & { id?: string }) => {
    if (taskData.id) {
      // Editing existing task
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskData.id
            ? { ...t, title: taskData.title, description: taskData.description, columnId: taskData.columnId }
            : t
        )
      );
    } else {
      // Adding new task
      const newTask: Task = {
        id: generateId(),
        title: taskData.title,
        description: taskData.description,
        columnId: taskData.columnId,
        createdAt: Date.now(),
      };
      setTasks((prevTasks) => [...prevTasks, newTask]);
    }
  }, [setTasks]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Kanban Board</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Organize your tasks with drag and drop
              </p>
            </div>
            <Button onClick={() => handleAddTask('todo')} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Task</span>
            </Button>
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
