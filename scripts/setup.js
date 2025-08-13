const mongoose = require('mongoose');
const User = require('../models/User');
const Workflow = require('../models/Workflow');
require('dotenv').config({ path: './config.env' });

const setupDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Workflow.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });
    console.log('Created admin user:', adminUser.email);

    // Create manager user
    const managerUser = await User.create({
      name: 'Manager User',
      email: 'manager@example.com',
      password: 'manager123',
      role: 'manager'
    });
    console.log('Created manager user:', managerUser.email);

    // Create regular user
    const regularUser = await User.create({
      name: 'Regular User',
      email: 'user@example.com',
      password: 'user123',
      role: 'user'
    });
    console.log('Created regular user:', regularUser.email);

    // Create sample workflows
    const sampleWorkflows = [
      {
        title: 'Website Redesign Project',
        description: 'Complete redesign of company website with modern UI/UX',
        status: 'active',
        priority: 'high',
        category: 'Development',
        assignedTo: [managerUser._id, regularUser._id],
        createdBy: adminUser._id,
        steps: [
          {
            title: 'Design Phase',
            description: 'Create wireframes and mockups',
            order: 1,
            status: 'completed',
            assignedTo: managerUser._id,
            completedAt: new Date()
          },
          {
            title: 'Development Phase',
            description: 'Implement the design using React',
            order: 2,
            status: 'in_progress',
            assignedTo: regularUser._id
          },
          {
            title: 'Testing Phase',
            description: 'Test all functionality and fix bugs',
            order: 3,
            status: 'pending'
          }
        ],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        tags: ['website', 'design', 'react'],
        isPublic: true
      },
      {
        title: 'Marketing Campaign',
        description: 'Launch new marketing campaign for Q4',
        status: 'draft',
        priority: 'medium',
        category: 'Marketing',
        assignedTo: [managerUser._id],
        createdBy: adminUser._id,
        steps: [
          {
            title: 'Strategy Planning',
            description: 'Define campaign goals and target audience',
            order: 1,
            status: 'pending'
          },
          {
            title: 'Content Creation',
            description: 'Create marketing materials and content',
            order: 2,
            status: 'pending'
          },
          {
            title: 'Launch',
            description: 'Execute the campaign across all channels',
            order: 3,
            status: 'pending'
          }
        ],
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        tags: ['marketing', 'campaign', 'q4'],
        isPublic: false
      }
    ];

    for (const workflowData of sampleWorkflows) {
      const workflow = await Workflow.create(workflowData);
      console.log('Created workflow:', workflow.title);
    }

    console.log('\n✅ Database setup completed successfully!');
    console.log('\n📋 Sample Users:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Manager: manager@example.com / manager123');
    console.log('User: user@example.com / user123');
    console.log('\n🚀 You can now start the server with: npm run dev');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
