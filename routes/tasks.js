const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get all tasks for current employee
router.get('/', protect, async (req, res) => {
  try {
    const { projectId, status, date } = req.query;
    let query = { employeeId: req.employee.id };

    if (projectId) {
      query.projectId = projectId;
    }
    if (status) {
      query.status = status;
    }
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }

    const tasks = await Task.find(query)
      .populate('projectId', 'projectName')
      .sort({ date: -1, createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get single task
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      employeeId: req.employee.id
    }).populate('projectId', 'projectName');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Create new task
router.post('/', protect, async (req, res) => {
  try {
    const { taskTitle, taskDescription, projectId, daysSpent, date, status, priority, notes } = req.body;

    // Verify project belongs to employee
    const project = await Project.findOne({
      _id: projectId,
      employeeId: req.employee.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const task = await Task.create({
      taskTitle,
      taskDescription,
      projectId,
      employeeId: req.employee.id,
      daysSpent: daysSpent || 0,
      date: date || new Date(),
      status: status || 'pending',
      priority: priority || 'medium',
      notes
    });

    const populatedTask = await Task.findById(task._id)
      .populate('projectId', 'projectName');

    res.status(201).json({
      success: true,
      data: populatedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Update task
router.put('/:id', protect, async (req, res) => {
  try {
    const { taskTitle, taskDescription, daysSpent, date, status, priority, notes } = req.body;

    let task = await Task.findOne({
      _id: req.params.id,
      employeeId: req.employee.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        taskTitle,
        taskDescription,
        daysSpent,
        date,
        status,
        priority,
        notes
      },
      { new: true, runValidators: true }
    ).populate('projectId', 'projectName');

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Delete task
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      employeeId: req.employee.id
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.deleteOne();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get tasks by project
router.get('/project/:projectId', protect, async (req, res) => {
  try {
    // Verify project belongs to employee
    const project = await Project.findOne({
      _id: req.params.projectId,
      employeeId: req.employee.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const tasks = await Task.find({
      projectId: req.params.projectId,
      employeeId: req.employee.id
    }).sort({ date: -1, createdAt: -1 });

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get task statistics
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments({ employeeId: req.employee.id });
    const pendingTasks = await Task.countDocuments({ 
      employeeId: req.employee.id, 
      status: 'pending' 
    });
    const workingTasks = await Task.countDocuments({ 
      employeeId: req.employee.id, 
      status: 'working' 
    });
    const completedTasks = await Task.countDocuments({ 
      employeeId: req.employee.id, 
      status: 'done' 
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasks = await Task.countDocuments({
      employeeId: req.employee.id,
      date: { $gte: today, $lt: tomorrow }
    });

    res.json({
      success: true,
      data: {
        totalTasks,
        pendingTasks,
        workingTasks,
        completedTasks,
        todayTasks
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
