import { Droppable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { Task, ColumnId } from '@/types/kanban';
import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';

interface KanbanColumnProps {
  id: ColumnId;
  title: string;
  tasks: Task[];
  onAddTask: (columnId: ColumnId) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const columnStyles: Record<ColumnId, string> = {
  'todo': 'bg-column-todo border-column-todo-border',
  'in-progress': 'bg-column-progress border-column-progress-border',
  'done': 'bg-column-done border-column-done-border',
};

export function KanbanColumn({ 
  id, 
  title, 
  tasks, 
  onAddTask, 
  onEditTask, 
  onDeleteTask 
}: KanbanColumnProps) {
  return (
    <div className={`flex flex-col rounded-xl border ${columnStyles[id]} min-h-[500px] md:min-h-[600px]`}>
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => onAddTask(id)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2 space-y-2 transition-colors rounded-b-xl ${
              snapshot.isDraggingOver ? 'column-drop-active' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
            {provided.placeholder}
            
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-24 text-sm text-muted-foreground/60">
                No tasks yet
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
