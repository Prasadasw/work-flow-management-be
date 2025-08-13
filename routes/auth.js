const express = require('express');
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Register Employee
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, mobileNumber, designation, password } = req.body;

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: 'Employee with this email already exists'
      });
    }

    // Create employee
    const employee = await Employee.create({
      fullName,
      email,
      mobileNumber,
      designation,
      password
    });

    // Create token
    const token = jwt.sign({ id: employee._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.status(201).json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          fullName: employee.fullName,
          email: employee.email,
          mobileNumber: employee.mobileNumber,
          designation: employee.designation
        },
        token
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

// Login Employee
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if employee exists
    const employee = await Employee.findOne({ email }).select('+password');
    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await employee.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Create token
    const token = jwt.sign({ id: employee._id }, process.env.JWT_SECRET, {
      expiresIn: '30d'
    });

    res.json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          fullName: employee.fullName,
          email: employee.email,
          mobileNumber: employee.mobileNumber,
          designation: employee.designation
        },
        token
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

// Get current employee
router.get('/me', protect, async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee.id);
    res.json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          fullName: employee.fullName,
          email: employee.email,
          mobileNumber: employee.mobileNumber,
          designation: employee.designation
        }
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
