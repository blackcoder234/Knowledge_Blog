const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
const mongoose = require('mongoose');

// Need to define the Post model schema here since we're running in isolation
const PostSchema = new mongoose.Schema({
  title: String,
  likes: Number,
});

const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

async function seedLikes() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable');
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await Post.updateMany(
      { $or: [{ likes: { $exists: false } }, { likes: { $lt: 100 } }] },
      { $set: { likes: 100 } }
    );

    console.log(`Updated ${result.modifiedCount} posts to have 100 likes.`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding likes:', error);
    process.exit(1);
  }
}

seedLikes();
