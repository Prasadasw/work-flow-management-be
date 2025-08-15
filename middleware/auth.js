const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const employee = await Employee.findById(decoded.id).select('-password');
    
    if (!employee) {
      return res.status(401).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Set both employee and user for compatibility
    req.employee = employee;
    req.user = {
      id: employee._id,
      name: employee.fullName,
      email: employee.email,
      role: employee.designation === 'admin' ? 'admin' : 'user' // Map designation to role
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};

module.exports = { protect };
