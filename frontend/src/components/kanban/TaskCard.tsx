import { Draggable } from '@hello-pangea/dnd';
import { Pencil, Trash2, GripVertical } from 'lucide-react';
import { Task } from '@/types/kanban';
import { Button } from '@/components/ui/button';

interface TaskCardProps {
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, index, onEdit, onDelete }: TaskCardProps) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`task-card group animate-fade-in ${snapshot.isDragging ? 'task-card-dragging' : ''
            }`}
        >
          <div className="flex items-start gap-2">
            <div
              {...provided.dragHandleProps}
              className="mt-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground leading-snug break-words">
                {task.title}
              </h3>
              {task.description && (
                <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 break-words">
                  {task.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => onEdit(task)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(task.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}