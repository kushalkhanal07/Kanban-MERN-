const express = require('express');
const router = express.Router();
const Column = require('../models/Column');

// Initialize default columns
const DEFAULT_COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' }
];

// GET all columns
router.get('/', async (req, res) => {
  try {
    let columns = await Column.find();

    // If no columns exist, create default ones
    if (columns.length === 0) {
      await Column.create(DEFAULT_COLUMNS);
      columns = await Column.find();
    }

    res.json({
      success: true,
      data: columns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

// GET single column with tasks
router.get('/:id', async (req, res) => {
  try {
    const column = await Column.findById(req.params.id).populate('taskOrder');

    if (!column) {
      return res.status(404).json({
        success: false,
        error: 'Column not found'
      });
    }

    res.json({
      success: true,
      data: column
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: error.message
    });
  }
});

// PUT update column
router.put('/:id', async (req, res) => {
  try {
    const { title, taskOrder } = req.body;

    const column = await Column.findByIdAndUpdate(
      req.params.id,
      { title, taskOrder },
      { new: true, runValidators: true }
    );

    if (!column) {
      return res.status(404).json({
        success: false,
        error: 'Column not found'
      });
    }

    res.json({
      success: true,
      message: 'Column updated successfully',
      data: column
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

module.exports = router;