const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define Category Schema locally to avoid import issues with ES modules in script
const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  language: { type: String, default: 'English' },
  genre: { type: String, required: true },
  description: { type: String },
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

const categories = [
  // --- ENGLISH ---
  // Science
  { name: 'Physics', slug: 'physics', genre: 'Science', language: 'English' },
  { name: 'Mathematics', slug: 'mathematics', genre: 'Science', language: 'English' },
  { name: 'Biology', slug: 'biology', genre: 'Science', language: 'English' },
  { name: 'Astronomy', slug: 'astronomy', genre: 'Science', language: 'English' },
  { name: 'Chemistry', slug: 'chemistry', genre: 'Science', language: 'English' },
  
  // Technology
  { name: 'Artificial Intelligence', slug: 'artificial-intelligence', genre: 'Technology', language: 'English' },
  { name: 'Web Development', slug: 'web-development', genre: 'Technology', language: 'English' },
  { name: 'Cybersecurity', slug: 'cybersecurity', genre: 'Technology', language: 'English' },
  { name: 'Blockchain', slug: 'blockchain', genre: 'Technology', language: 'English' },
  { name: 'Cloud Computing', slug: 'cloud-computing', genre: 'Technology', language: 'English' },

  // Philosophy
  { name: 'Ethics', slug: 'ethics', genre: 'Philosophy', language: 'English' },
  { name: 'Metaphysics', slug: 'metaphysics', genre: 'Philosophy', language: 'English' },
  { name: 'Logic', slug: 'logic', genre: 'Philosophy', language: 'English' },
  { name: 'Epistemology', slug: 'epistemology', genre: 'Philosophy', language: 'English' },

  // History & Culture
  { name: 'Ancient History', slug: 'ancient-history', genre: 'History', language: 'English' },
  { name: 'Modern Art', slug: 'modern-art', genre: 'Culture', language: 'English' },
  { name: 'Digital Culture', slug: 'digital-culture', genre: 'Culture', language: 'English' },


  // --- BENGALI (Bangla) ---
  // Bigyan (Science)
  { name: 'পদার্থবিদ্যা (Physics)', slug: 'bangla-physics', genre: 'Bigyan', language: 'Bengali' },
  { name: 'গণিত (Math)', slug: 'bangla-math', genre: 'Bigyan', language: 'Bengali' },
  { name: 'মহাকাশ (Space)', slug: 'bangla-space', genre: 'Bigyan', language: 'Bengali' },

  // Projukti (Tech)
  { name: 'প্রযুক্তি (Tech)', slug: 'bangla-tech', genre: 'Projukti', language: 'Bengali' },
  { name: 'প্রোগ্রামিং (Programming)', slug: 'bangla-programming', genre: 'Projukti', language: 'Bengali' },

  // Sahitya & Darshan (Lit/Phil)
  { name: 'দর্শন (Philosophy)', slug: 'bangla-philosophy', genre: 'Darshan', language: 'Bengali' },
  { name: 'ইতিহাস (History)', slug: 'bangla-history', genre: 'Itihas', language: 'Bengali' },
];

async function seedCategories() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env.local');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    console.log('Clearing existing categories...');
    await Category.deleteMany({});

    console.log('Seeding new categories...');
    await Category.insertMany(categories);

    console.log('Done! Seeded ' + categories.length + ' categories.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();
