const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema({
  id: {
    type: String,
    required: [true, 'Column ID is required'],
    unique: true,
    enum: ['todo', 'in-progress', 'done']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  taskOrder: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp on save
columnSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Column = mongoose.model('Column', columnSchema);

module.exports = Column;