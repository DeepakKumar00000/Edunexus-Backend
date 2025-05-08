require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/category');

const categories = [
  { name: 'Web Development', description: 'Learn to build modern web applications' },
  { name: 'Mobile Development', description: 'Master mobile app development for iOS and Android' },
  { name: 'Data Science', description: 'Explore data analysis, machine learning, and AI' },
  { name: 'Programming', description: 'Learn programming fundamentals and advanced concepts' },
  { name: 'DevOps', description: 'Understand deployment, automation, and cloud infrastructure' },
  { name: 'Machine Learning', description: 'Study algorithms and models for data analysis and prediction' }
  
];

async function seedDB() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to MongoDB');

    await Category.deleteMany({});
    console.log('Cleared existing categories');

    await Category.insertMany(categories);
    console.log('Added new categories');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedDB();
