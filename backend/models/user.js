const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  skinType: { type: String, required: true },

  // This will store the 4-step array Gemini generates
  savedRoutine: { type: Array, default: [] }, 

  // Gamification tracking
  currentStreak: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  lastCompletedDate: { type: Date, default: null }
});

module.exports = mongoose.model('User', userSchema);