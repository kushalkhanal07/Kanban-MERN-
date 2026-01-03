const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  columnId: {
    type: String,
    required: [true, 'Column ID is required'],
    enum: {
      values: ['todo', 'in-progress', 'done'],
      message: 'Invalid column ID'
    },
    default: 'todo'
  },
  position: {
    type: Number,
    required: true,
    default: 0
  },
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
taskSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to get next position in a column
taskSchema.statics.getNextPosition = async function (columnId) {
  const lastTask = await this.findOne({ columnId })
    .sort({ position: -1 })
    .limit(1);

  return lastTask ? lastTask.position + 1 : 0;
};

// Add virtual id field
taskSchema.virtual('id').get(function () {
  return this._id.toString();
});

// Ensure virtual fields are included when converting to JSON
taskSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Ensure virtual fields are included when converting to Object
taskSchema.set('toObject', {
  virtuals: true,
  transform: function (doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;