const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskTitle: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Task title cannot exceed 200 characters']
  },
  taskDescription: {
    type: String,
    required: [true, 'Task description is required'],
    maxlength: [1000, 'Task description cannot exceed 1000 characters']
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  daysSpent: {
    type: Number,
    min: [0, 'Days spent cannot be negative'],
    default: 0
  },
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'working', 'done'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  completedDate: {
    type: Date
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Update completedDate when status changes to 'done'
taskSchema.pre('save', function(next) {
  if (this.status === 'done' && !this.completedDate) {
    this.completedDate = new Date();
  }
  next();
});

module.exports = mongoose.model('Task', taskSchema);
