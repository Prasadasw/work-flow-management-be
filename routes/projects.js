const express = require('express');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get all projects for current employee
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({ employeeId: req.employee.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get single project
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      employeeId: req.employee.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Create new project
router.post('/', protect, async (req, res) => {
  try {
    const { projectName, description, clientName, priority, endDate } = req.body;

    const project = await Project.create({
      projectName,
      description,
      clientName,
      priority,
      endDate,
      employeeId: req.employee.id
    });

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Update project
router.put('/:id', protect, async (req, res) => {
  try {
    const { projectName, description, clientName, priority, status, endDate } = req.body;

    let project = await Project.findOne({
      _id: req.params.id,
      employeeId: req.employee.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        projectName,
        description,
        clientName,
        priority,
        status,
        endDate
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Delete project
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      employeeId: req.employee.id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    await project.deleteOne();

    res.json({
      success: true,
      message: 'Project deleted successfully'
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
