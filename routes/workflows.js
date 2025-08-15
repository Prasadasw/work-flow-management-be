const express = require('express');
const { body, validationResult } = require('express-validator');
const Workflow = require('../models/Workflow');
const Employee = require('../models/Employee');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// @desc    Get all workflows
// @route   GET /api/workflows
// @access  Private
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    // Build query based on user role and filters
    let query = {};
    
    // If user is not admin, only show workflows they created or are assigned to
    if (req.user.role !== 'admin') {
      query.$or = [
        { createdBy: req.user.id },
        { assignedTo: req.user.id },
        { isPublic: true }
      ];
    }

    // Add filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.priority) {
      query.priority = req.query.priority;
    }
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const total = await Workflow.countDocuments(query);

    const workflows = await Workflow.find(query)
      .populate('createdBy', 'fullName email')
      .populate('assignedTo', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(startIndex);

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.json({
      status: 'success',
      count: workflows.length,
      pagination,
      data: workflows
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @desc    Get single workflow
// @route   GET /api/workflows/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id)
      .populate('createdBy', 'fullName email')
      .populate('assignedTo', 'fullName email')
      .populate('steps.assignedTo', 'fullName email')
      .populate('comments.user', 'fullName email');

    if (!workflow) {
      return res.status(404).json({
        status: 'error',
        message: 'Workflow not found'
      });
    }

    // Check if user has access to this workflow
    if (req.user.role !== 'admin' && 
        workflow.createdBy._id.toString() !== req.user.id &&
        !workflow.assignedTo.some(user => user._id.toString() === req.user.id) &&
        !workflow.isPublic) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access this workflow'
      });
    }

    res.json({
      status: 'success',
      data: workflow
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @desc    Create new workflow
// @route   POST /api/workflows
// @access  Private
router.post('/', [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('assignedTo')
    .optional()
    .isArray()
    .withMessage('AssignedTo must be an array'),
  body('steps')
    .optional()
    .isArray()
    .withMessage('Steps must be an array'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const {
      title,
      description,
      category,
      priority,
      assignedTo,
      steps,
      dueDate,
      tags,
      isPublic
    } = req.body;

    // Validate assigned users if provided
    if (assignedTo && assignedTo.length > 0) {
      const validUsers = await User.find({ _id: { $in: assignedTo } });
      if (validUsers.length !== assignedTo.length) {
        return res.status(400).json({
          status: 'error',
          message: 'One or more assigned users not found'
        });
      }
    }

    // Create workflow
    const workflow = await Workflow.create({
      title,
      description,
      category,
      priority: priority || 'medium',
      assignedTo: assignedTo || [],
      steps: steps || [],
      dueDate,
      tags: tags || [],
      isPublic: isPublic || false,
      createdBy: req.user.id
    });

    const populatedWorkflow = await Workflow.findById(workflow._id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    res.status(201).json({
      status: 'success',
      data: populatedWorkflow
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @desc    Update workflow
// @route   PUT /api/workflows/:id
// @access  Private
router.put('/:id', [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'active', 'paused', 'completed', 'cancelled'])
    .withMessage('Status must be draft, active, paused, completed, or cancelled'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be low, medium, high, or urgent'),
  body('assignedTo')
    .optional()
    .isArray()
    .withMessage('AssignedTo must be an array'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Due date must be a valid date'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be a boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    let workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        status: 'error',
        message: 'Workflow not found'
      });
    }

    // Check if user has permission to update this workflow
    if (req.user.role !== 'admin' && 
        workflow.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this workflow'
      });
    }

    const fieldsToUpdate = {
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      priority: req.body.priority,
      assignedTo: req.body.assignedTo,
      dueDate: req.body.dueDate,
      tags: req.body.tags,
      isPublic: req.body.isPublic
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    // Set completedAt if status is completed
    if (req.body.status === 'completed' && workflow.status !== 'completed') {
      fieldsToUpdate.completedAt = new Date();
    }

    // Validate assigned users if provided
    if (fieldsToUpdate.assignedTo && fieldsToUpdate.assignedTo.length > 0) {
      const validUsers = await User.find({ _id: { $in: fieldsToUpdate.assignedTo } });
      if (validUsers.length !== fieldsToUpdate.assignedTo.length) {
        return res.status(400).json({
          status: 'error',
          message: 'One or more assigned users not found'
        });
      }
    }

    workflow = await Workflow.findByIdAndUpdate(
      req.params.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    ).populate('createdBy', 'name email')
     .populate('assignedTo', 'name email');

    res.json({
      status: 'success',
      data: workflow
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @desc    Delete workflow
// @route   DELETE /api/workflows/:id
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        status: 'error',
        message: 'Workflow not found'
      });
    }

    // Check if user has permission to delete this workflow
    if (req.user.role !== 'admin' && 
        workflow.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this workflow'
      });
    }

    await workflow.remove();

    res.json({
      status: 'success',
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @desc    Update workflow step
// @route   PUT /api/workflows/:id/steps/:stepId
// @access  Private
router.put('/:id/steps/:stepId', [
  body('status')
    .isIn(['pending', 'in_progress', 'completed', 'skipped'])
    .withMessage('Status must be pending, in_progress, completed, or skipped'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        status: 'error',
        message: 'Workflow not found'
      });
    }

    // Check if user has access to this workflow
    if (req.user.role !== 'admin' && 
        workflow.createdBy.toString() !== req.user.id &&
        !workflow.assignedTo.includes(req.user.id) &&
        !workflow.isPublic) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this workflow'
      });
    }

    const step = workflow.steps.id(req.params.stepId);
    if (!step) {
      return res.status(404).json({
        status: 'error',
        message: 'Step not found'
      });
    }

    // Update step
    step.status = req.body.status;
    if (req.body.notes) step.notes = req.body.notes;
    if (req.body.status === 'completed') {
      step.completedAt = new Date();
    }

    await workflow.save();

    const updatedWorkflow = await Workflow.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('steps.assignedTo', 'name email');

    res.json({
      status: 'success',
      data: updatedWorkflow
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @desc    Add comment to workflow
// @route   POST /api/workflows/:id/comments
// @access  Private
router.post('/:id/comments', [
  body('text')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const workflow = await Workflow.findById(req.params.id);

    if (!workflow) {
      return res.status(404).json({
        status: 'error',
        message: 'Workflow not found'
      });
    }

    // Check if user has access to this workflow
    if (req.user.role !== 'admin' && 
        workflow.createdBy.toString() !== req.user.id &&
        !workflow.assignedTo.includes(req.user.id) &&
        !workflow.isPublic) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to comment on this workflow'
      });
    }

    workflow.comments.push({
      user: req.user.id,
      text: req.body.text
    });

    await workflow.save();

    const updatedWorkflow = await Workflow.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email');

    res.json({
      status: 'success',
      data: updatedWorkflow
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @desc    Get workflow statistics
// @route   GET /api/workflows/stats/overview
// @access  Private
router.get('/stats/overview', async (req, res) => {
  try {
    let query = {};
    
    // If user is not admin, only show stats for workflows they have access to
    if (req.user.role !== 'admin') {
      query.$or = [
        { createdBy: req.user.id },
        { assignedTo: req.user.id },
        { isPublic: true }
      ];
    }

    const totalWorkflows = await Workflow.countDocuments(query);
    const activeWorkflows = await Workflow.countDocuments({ ...query, status: 'active' });
    const completedWorkflows = await Workflow.countDocuments({ ...query, status: 'completed' });
    const overdueWorkflows = await Workflow.countDocuments({
      ...query,
      dueDate: { $lt: new Date() },
      status: { $nin: ['completed', 'cancelled'] }
    });

    const statusStats = await Workflow.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await Workflow.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentWorkflows = await Workflow.find(query)
      .select('title status priority dueDate createdAt')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      status: 'success',
      data: {
        totalWorkflows,
        activeWorkflows,
        completedWorkflows,
        overdueWorkflows,
        statusStats,
        priorityStats,
        recentWorkflows
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

module.exports = router;
