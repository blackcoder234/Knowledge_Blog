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
  // ────────────────────────
  // ENGLISH CATEGORIES
  // ────────────────────────

  // Science
  { name: 'Physics', slug: 'physics', genre: 'Science', language: 'English' },
  { name: 'Chemistry', slug: 'chemistry', genre: 'Science', language: 'English' },
  { name: 'Mathematics', slug: 'mathematics', genre: 'Science', language: 'English' },
  { name: 'Biology', slug: 'biology', genre: 'Science', language: 'English' },

  // Technology
  { name: 'Software Engineering', slug: 'software-engineering', genre: 'Technology', language: 'English' },
  { name: 'Web Development', slug: 'web-development', genre: 'Technology', language: 'English' },
  { name: 'Artificial Intelligence', slug: 'artificial-intelligence', genre: 'Technology', language: 'English' },
  { name: 'Cybersecurity', slug: 'cybersecurity', genre: 'Technology', language: 'English' },
  { name: 'Cloud Computing', slug: 'cloud-computing', genre: 'Technology', language: 'English' },

  // Astronomy
  { name: 'Astrophysics', slug: 'astrophysics', genre: 'Astronomy', language: 'English' },
  { name: 'Cosmology', slug: 'cosmology', genre: 'Astronomy', language: 'English' },
  { name: 'Planetary Science', slug: 'planetary-science', genre: 'Astronomy', language: 'English' },
  { name: 'Space Exploration', slug: 'space-exploration', genre: 'Astronomy', language: 'English' },

  // Philosophy
  { name: 'Ethics', slug: 'ethics', genre: 'Philosophy', language: 'English' },
  { name: 'Logic', slug: 'logic', genre: 'Philosophy', language: 'English' },
  { name: 'Metaphysics', slug: 'metaphysics', genre: 'Philosophy', language: 'English' },
  { name: 'Epistemology', slug: 'epistemology', genre: 'Philosophy', language: 'English' },
  { name: 'Spiritual & Eastern Philosophy', slug: 'spiritual-eastern-philosophy', genre: 'Philosophy', language: 'English' },

  // Society & Culture
  { name: 'Sociology', slug: 'sociology', genre: 'Society & Culture', language: 'English' },
  { name: 'Economics', slug: 'economics', genre: 'Society & Culture', language: 'English' },
  { name: 'Psychology', slug: 'psychology', genre: 'Society & Culture', language: 'English' },
  { name: 'Education', slug: 'education', genre: 'Society & Culture', language: 'English' },
  { name: 'Cultural Studies', slug: 'cultural-studies', genre: 'Society & Culture', language: 'English' },

  // Earth & Environment
  { name: 'Physical Geography', slug: 'physical-geography', genre: 'Earth & Environment', language: 'English' },
  { name: 'Environmental Science', slug: 'environmental-science', genre: 'Earth & Environment', language: 'English' },
  { name: 'Climate Studies', slug: 'climate-studies', genre: 'Earth & Environment', language: 'English' },
  { name: 'Ecology', slug: 'ecology', genre: 'Earth & Environment', language: 'English' },

  // History
  { name: 'Ancient History', slug: 'ancient-history', genre: 'History', language: 'English' },
  { name: 'Medieval History', slug: 'medieval-history', genre: 'History', language: 'English' },
  { name: 'Modern History', slug: 'modern-history', genre: 'History', language: 'English' },
  { name: 'World History', slug: 'world-history', genre: 'History', language: 'English' },
  { name: 'Regional / Local History', slug: 'regional-local-history', genre: 'History', language: 'English' },

  // Arts & Literature
  { name: 'Painting & Visual Arts', slug: 'painting-visual-arts', genre: 'Arts & Literature', language: 'English' },
  { name: 'Modern Art', slug: 'modern-art', genre: 'Arts & Literature', language: 'English' },
  { name: 'Architecture', slug: 'architecture', genre: 'Arts & Literature', language: 'English' },
  { name: 'Poetry', slug: 'poetry', genre: 'Arts & Literature', language: 'English' },
  { name: 'Fiction', slug: 'fiction', genre: 'Arts & Literature', language: 'English' },
  { name: 'Literary Criticism', slug: 'literary-criticism', genre: 'Arts & Literature', language: 'English' },

  // Agriculture
  { name: 'Agricultural Science', slug: 'agricultural-science', genre: 'Agriculture', language: 'English' },
  { name: 'Crop Science', slug: 'crop-science', genre: 'Agriculture', language: 'English' },
  { name: 'Soil Science', slug: 'soil-science', genre: 'Agriculture', language: 'English' },
  { name: 'Sustainable Farming', slug: 'sustainable-farming', genre: 'Agriculture', language: 'English' },
  { name: 'AgriTech', slug: 'agritech', genre: 'Agriculture', language: 'English' },

  // ────────────────────────
  // BENGALI CATEGORIES (বাংলা)
  // ────────────────────────

  // বিজ্ঞান (Science)
  { name: 'পদার্থবিজ্ঞান', slug: 'bn-physics', genre: 'বিজ্ঞান', language: 'Bengali' },
  { name: 'রসায়ন', slug: 'bn-chemistry', genre: 'বিজ্ঞান', language: 'Bengali' },
  { name: 'গণিত', slug: 'bn-mathematics', genre: 'বিজ্ঞান', language: 'Bengali' },
  { name: 'জীববিজ্ঞান', slug: 'bn-biology', genre: 'বিজ্ঞান', language: 'Bengali' },

  // প্রযুক্তি (Technology)
  { name: 'সফটওয়্যার ইঞ্জিনিয়ারিং', slug: 'bn-software-engineering', genre: 'প্রযুক্তি', language: 'Bengali' },
  { name: 'ওয়েব ডেভেলপমেন্ট', slug: 'bn-web-development', genre: 'প্রযুক্তি', language: 'Bengali' },
  { name: 'কৃত্রিম বুদ্ধিমত্তা', slug: 'bn-ai', genre: 'প্রযুক্তি', language: 'Bengali' },
  { name: 'সাইবার নিরাপত্তা', slug: 'bn-cybersecurity', genre: 'প্রযুক্তি', language: 'Bengali' },
  { name: 'ক্লাউড কম্পিউটিং', slug: 'bn-cloud-computing', genre: 'প্রযুক্তি', language: 'Bengali' },

  // জ্যোতির্বিজ্ঞান (Astronomy)
  { name: 'জ্যোতিঃপদার্থবিজ্ঞান', slug: 'bn-astrophysics', genre: 'জ্যোতির্বিজ্ঞান', language: 'Bengali' },
  { name: 'বিশ্বতত্ত্ব', slug: 'bn-cosmology', genre: 'জ্যোতির্বিজ্ঞান', language: 'Bengali' },
  { name: 'গ্রহবিজ্ঞান', slug: 'bn-planetary-science', genre: 'জ্যোতির্বিজ্ঞান', language: 'Bengali' },
  { name: 'মহাকাশ অনুসন্ধান', slug: 'bn-space-exploration', genre: 'জ্যোতির্বিজ্ঞান', language: 'Bengali' },

  // দর্শন (Philosophy)
  { name: 'নীতিবিদ্যা', slug: 'bn-ethics', genre: 'দর্শন', language: 'Bengali' },
  { name: 'যুক্তিবিদ্যা', slug: 'bn-logic', genre: 'দর্শন', language: 'Bengali' },
  { name: 'অধিবিদ্যা', slug: 'bn-metaphysics', genre: 'দর্শন', language: 'Bengali' },
  { name: 'জ্ঞানতত্ত্ব', slug: 'bn-epistemology', genre: 'দর্শন', language: 'Bengali' },
  { name: 'আধ্যাত্মিক ও প্রাচ্য দর্শন', slug: 'bn-spiritual-eastern-philosophy', genre: 'দর্শন', language: 'Bengali' },

  // সমাজ ও সংস্কৃতি (Society & Culture)
  { name: 'সমাজবিজ্ঞান', slug: 'bn-sociology', genre: 'সমাজ ও সংস্কৃতি', language: 'Bengali' },
  { name: 'অর্থনীতি', slug: 'bn-economics', genre: 'সমাজ ও সংস্কৃতি', language: 'Bengali' },
  { name: 'মনোবিজ্ঞান', slug: 'bn-psychology', genre: 'সমাজ ও সংস্কৃতি', language: 'Bengali' },
  { name: 'শিক্ষা', slug: 'bn-education', genre: 'সমাজ ও সংস্কৃতি', language: 'Bengali' },
  { name: 'সংস্কৃতি অধ্যয়ন', slug: 'bn-cultural-studies', genre: 'সমাজ ও সংস্কৃতি', language: 'Bengali' },

  // পৃথিবী ও পরিবেশ (Earth & Environment)
  { name: 'প্রাকৃতিক ভূগোল', slug: 'bn-physical-geography', genre: 'পৃথিবী ও পরিবেশ', language: 'Bengali' },
  { name: 'পরিবেশ বিজ্ঞান', slug: 'bn-environmental-science', genre: 'পৃথিবী ও পরিবেশ', language: 'Bengali' },
  { name: 'জলবায়ু বিদ্যা', slug: 'bn-climate-studies', genre: 'পৃথিবী ও পরিবেশ', language: 'Bengali' },
  { name: 'বাস্তুসংস্থান', slug: 'bn-ecology', genre: 'পৃথিবী ও পরিবেশ', language: 'Bengali' },

  // ইতিহাস (History)
  { name: 'প্রাচীন ইতিহাস', slug: 'bn-ancient-history', genre: 'ইতিহাস', language: 'Bengali' },
  { name: 'মধ্যযুগীয় ইতিহাস', slug: 'bn-medieval-history', genre: 'ইতিহাস', language: 'Bengali' },
  { name: 'আধুনিক ইতিহাস', slug: 'bn-modern-history', genre: 'ইতিহাস', language: 'Bengali' },
  { name: 'বিশ্ব ইতিহাস', slug: 'bn-world-history', genre: 'ইতিহাস', language: 'Bengali' },
  { name: 'আঞ্চলিক ইতিহাস', slug: 'bn-regional-history', genre: 'ইতিহাস', language: 'Bengali' },

  // শিল্প ও সাহিত্য (Arts & Literature)
  { name: 'চিত্রকলা ও দৃশ্যশিল্প', slug: 'bn-painting-visual-arts', genre: 'শিল্প ও সাহিত্য', language: 'Bengali' },
  { name: 'আধুনিক শিল্পকলা', slug: 'bn-modern-art', genre: 'শিল্প ও সাহিত্য', language: 'Bengali' },
  { name: 'স্থাপত্যশৈলী', slug: 'bn-architecture', genre: 'শিল্প ও সাহিত্য', language: 'Bengali' },
  { name: 'কবিতা', slug: 'bn-poetry', genre: 'শিল্প ও সাহিত্য', language: 'Bengali' },
  { name: 'কথাসাহিত্য', slug: 'bn-fiction', genre: 'শিল্প ও সাহিত্য', language: 'Bengali' },
  { name: 'সাহিত্য সমালোচনা', slug: 'bn-literary-criticism', genre: 'শিল্প ও সাহিত্য', language: 'Bengali' },

  // কৃষি (Agriculture)
  { name: 'কৃষিবিজ্ঞান', slug: 'bn-agricultural-science', genre: 'কৃষি', language: 'Bengali' },
  { name: 'শস্য বিজ্ঞান', slug: 'bn-crop-science', genre: 'কৃষি', language: 'Bengali' },
  { name: 'মৃত্তিকা বিজ্ঞান', slug: 'bn-soil-science', genre: 'কৃষি', language: 'Bengali' },
  { name: 'টেকসই কৃষি', slug: 'bn-sustainable-farming', genre: 'কৃষি', language: 'Bengali' },
  { name: 'কৃষিপ্রযুক্তি', slug: 'bn-agritech', genre: 'কৃষি', language: 'Bengali' }
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
