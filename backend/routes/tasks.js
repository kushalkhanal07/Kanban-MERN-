const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// GET all tasks
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

// GET tasks by column
router.get('/column/:columnId', async (req, res) => {
  try {
    const { columnId } = req.params;
    const tasks = await Task.find({ columnId }).sort({ position: 1 });

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

// GET single task
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

// POST create new task
router.post('/', async (req, res) => {
  try {
    const { title, description, columnId } = req.body;

    // Get next position for the column
    const position = await Task.getNextPosition(columnId || 'todo');

    const task = new Task({
      title,
      description,
      columnId: columnId || 'todo',
      position
    });

    await task.save();

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        messages
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

// PUT update task
router.put('/:id', async (req, res) => {
  try {
    const { title, description, columnId, position } = req.body;
    const taskId = req.params.id;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (columnId !== undefined) updateData.columnId = columnId;
    if (position !== undefined) updateData.position = position;

    const task = await Task.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: task
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        messages
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

// PATCH update task position (drag and drop)
// PATCH update task position (drag and drop) - FIXED VERSION
router.patch('/:id/move', async (req, res) => {
  try {
    const { columnId, position, sourceColumnId } = req.body;
    const taskId = req.params.id;

    console.log(`Moving task ${taskId} to column ${columnId} at position ${position}`);

    // Find the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const oldColumnId = task.columnId;
    const oldPosition = task.position;

    // If moving to a different column
    if (sourceColumnId && sourceColumnId !== columnId) {
      console.log(`Moving between columns: ${sourceColumnId} -> ${columnId}`);

      // Remove from old column: decrement positions of tasks after the moved task
      await Task.updateMany(
        {
          columnId: sourceColumnId,
          position: { $gt: oldPosition }
        },
        { $inc: { position: -1 } }
      );

      // Make space in new column: increment positions of tasks at or after the new position
      await Task.updateMany(
        {
          columnId: columnId,
          position: { $gte: position }
        },
        { $inc: { position: 1 } }
      );

    } else if (columnId === oldColumnId) {
      console.log(`Reordering within same column: ${columnId}`);

      // Moving within the same column
      if (position > oldPosition) {
        // Moving down: decrement positions between old and new position
        await Task.updateMany(
          {
            columnId: columnId,
            position: { $gt: oldPosition, $lte: position }
          },
          { $inc: { position: -1 } }
        );
      } else if (position < oldPosition) {
        // Moving up: increment positions between new and old position
        await Task.updateMany(
          {
            columnId: columnId,
            position: { $lt: oldPosition, $gte: position }
          },
          { $inc: { position: 1 } }
        );
      } else {
        // Position unchanged
        console.log('Position unchanged');
      }
    }

    // Update the task with new column and position
    task.columnId = columnId;
    task.position = position;
    await task.save();

    console.log(`Task moved successfully. New column: ${columnId}, New position: ${position}`);

    res.json({
      success: true,
      message: 'Task moved successfully',
      data: task
    });
  } catch (error) {
    console.error('Error moving task:', error);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

// DELETE task
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Adjust positions in the column
    await Task.updateMany(
      {
        columnId: task.columnId,
        position: { $gt: task.position }
      },
      { $inc: { position: -1 } }
    );

    res.json({
      success: true,
      message: 'Task deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

// DELETE all tasks (for testing/reset)
router.delete('/', async (req, res) => {
  try {
    await Task.deleteMany({});
    res.json({
      success: true,
      message: 'All tasks deleted successfully',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

module.exports = router;