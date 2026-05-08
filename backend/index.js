require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');       // ✅ CHANGED: Groq instead of Gemini
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://cerahya.vercel.app'  // ← add this after you get your Vercel URL
  ],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ Successfully connected to MongoDB!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ CHANGED: Initialize Groq instead of Gemini
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const axios = require('axios');

// ✅ Helper: Ask Groq (replaces model.generateContent)
async function askGroq(prompt) {
  const result = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });
  return result.choices[0].message.content.trim();
}

app.get('/', (req, res) => {
  res.send("CeraHya AI Backend is running! 🤖");
});

// --- API: AI Routine Generator ---
app.post('/api/routine', async (req, res) => {
  try {
    const { skinType } = req.body;

    if (!skinType) {
      return res.status(400).json({ error: "Skin type is required" });
    }

    const prompt = `
      You are an expert dermatologist. Create a 4-step daily skincare routine (Cleanser, Serum, Moisturizer, Sunscreen) for someone with ${skinType} skin in India.
      
      Respond ONLY with a valid JSON array of exactly 4 objects. Do not include markdown formatting like \`\`\`json.
      Use this exact structure for each object:
      {
        "step": "Step Number and Name (e.g., 1. Cleanser)",
        "productName": "Real Product Name (e.g., Cetaphil Gentle Cleanser)",
        "description": "Short reason why it fits this skin type",
        "stores": [
          { "name": "Amazon", "price": "₹350", "url": "https://www.amazon.in/s?k=product+name" },
          { "name": "Nykaa", "price": "₹350", "url": "https://www.nykaa.com/search/result/?q=product+name" }
        ]
      }
    `;

    // ✅ CHANGED: Use askGroq helper
    let aiResponse = await askGroq(prompt);
    aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();

    const routineData = JSON.parse(aiResponse);
    res.json(routineData);

  } catch (error) {
    console.error("AI Generation Error:", error);
    res.status(500).json({ error: "Failed to generate routine. Please try again." });
  }
});

// --- Import User Model ---
const User = require('./models/user');

// --- API: Save Routine to User Profile ---
app.post('/api/user/save', async (req, res) => {
  try {
    const { username, skinType, routineData } = req.body;

    let user = await User.findOne({ username });
    if (!user) {
      user = new User({ username, skinType, savedRoutine: routineData });
    } else {
      user.skinType = skinType;
      user.savedRoutine = routineData;
    }
    
    await user.save();
    res.json({ message: "Routine saved successfully!", user });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "Failed to save profile." });
  }
});

// --- API: Gamification - Complete Daily Routine ---
app.post('/api/user/complete-daily', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username });

    if (!user) return res.status(404).json({ error: "User not found" });

    const today = new Date().setHours(0, 0, 0, 0);
    const lastCompleted = user.lastCompletedDate ? new Date(user.lastCompletedDate).setHours(0, 0, 0, 0) : null;

    if (lastCompleted === today) {
      return res.json({ message: "Already completed today!", streak: user.currentStreak, points: user.points });
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastCompleted === yesterday.getTime()) {
      user.currentStreak += 1;
    } else {
      user.currentStreak = 1;
    }

    user.points += 50;
    user.lastCompletedDate = new Date();
    
    await user.save();
    res.json({ 
      message: "Routine completed! +50 Points!", 
      streak: user.currentStreak, 
      points: user.points 
    });

  } catch (error) {
    res.status(500).json({ error: "Failed to update progress." });
  }
});

// --- API: Get User Dashboard Data ---
app.get('/api/user/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: "User not found. Please take the quiz and save your routine first!" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dashboard." });
  }
});

// --- API: AI Ingredient Analyzer ---
app.post('/api/analyze-ingredients', async (req, res) => {
  try {
    const { skinType, ingredients } = req.body;

    if (!skinType || !ingredients) {
      return res.status(400).json({ error: "Skin type and ingredients are required." });
    }

    const prompt = `
      You are an expert dermatologist. A user with ${skinType} skin wants to use a product with the following ingredients:
      ${ingredients}
      
      Analyze these ingredients specifically for ${skinType} skin. 
      Respond ONLY with a valid JSON object. Do not include markdown formatting like \`\`\`json.
      Use this exact structure:
      {
        "isSafe": true or false,
        "summary": "A short 2-sentence summary of whether this product is a good match or if they should avoid it.",
        "goodIngredients": ["name of ingredient - why it helps"],
        "badIngredients": ["name of bad ingredient - why it is bad (leave empty if none)"]
      }
    `;

    // ✅ CHANGED: Use askGroq helper
    let aiResponse = await askGroq(prompt);
    aiResponse = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const analysisData = JSON.parse(aiResponse);
    res.json(analysisData);

  } catch (error) {
    console.error("Ingredient Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze ingredients. Please try again." });
  }
});

// --- API: Weather Tip ---
app.post('/api/weather-tip', async (req, res) => {
  try {
    const { lat, lon } = req.body;

    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    const weatherData = await weatherRes.json();
    
    const temp = weatherData.current_weather.temperature;
    const isDay = weatherData.current_weather.is_day;
    
    const prompt = `The current weather for the user is ${temp}°C and it is currently ${isDay ? 'daytime' : 'nighttime'}. Provide a single, short, and catchy skincare tip for this exact weather condition. Keep it under 2 sentences.`;
    
    // ✅ CHANGED: Use askGroq helper
    const tip = await askGroq(prompt);

    res.json({ temp, tip });

  } catch (error) {
    console.error("Weather API Error:", error);
    res.status(500).json({ error: "Failed to generate weather tip." });
  }
});

// --- API: Add Custom Product to Routine ---
app.post('/api/user/add-product', async (req, res) => {
  try {
    const { username, newProduct } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    user.savedRoutine.push(newProduct);
    await user.save();

    res.json({ message: "Product added to your routine!", routine: user.savedRoutine });
  } catch (error) {
    console.error("Add Product Error:", error);
    res.status(500).json({ error: "Failed to add product." });
  }
});

// --- API: Delete Product from Routine ---
app.post('/api/user/delete-product', async (req, res) => {
  try {
    const { username, index } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    user.savedRoutine.splice(index, 1);
    user.markModified('savedRoutine');
    await user.save();

    res.json({ message: "Product removed!", routine: user.savedRoutine });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({ error: "Failed to delete product." });
  }
});

// --- API: Edit Product in Routine ---
app.post('/api/user/edit-product', async (req, res) => {
  try {
    const { username, index, updatedProduct } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    user.savedRoutine[index] = updatedProduct;
    user.markModified('savedRoutine');
    await user.save();

    res.json({ message: "Product updated!", routine: user.savedRoutine });
  } catch (error) {
    console.error("Edit Product Error:", error);
    res.status(500).json({ error: "Failed to edit product." });
  }
});

// --- API: Smart Portfolio Pricing Engine ---
app.post('/api/get-prices', (req, res) => {
  try {
    const { productName } = req.body;
    const searchName = productName.toLowerCase();

    let basePrice = 499; 

    if (searchName.includes('plum') && searchName.includes('toner')) {
      basePrice = 420; 
    } else if (searchName.includes('minimalist') && searchName.includes('niacinamide')) {
      basePrice = 599;
    } else if (searchName.includes('derma co') && searchName.includes('salicylic')) {
      basePrice = 299;
    } else if (searchName.includes('plum') && searchName.includes('moisturizer')) {
      basePrice = 470;
    } else if (searchName.includes('re\'equil') && searchName.includes('sunscreen')) {
      basePrice = 695;
    } else if (searchName.includes('cosrx') && searchName.includes('mucin')) {
      basePrice = 1450;
    } else if (searchName.includes('cetaphil') && searchName.includes('cleanser')) {
      basePrice = 333;
    }

    const stores = [
      { name: 'Blinkit', price: `₹${basePrice}`, url: `https://blinkit.com/s/?q=${encodeURIComponent(productName)}` },
      { name: 'Zepto', price: `₹${basePrice}`, url: `https://www.zeptonow.com/search?q=${encodeURIComponent(productName)}` },
      { name: 'Amazon', price: `₹${Math.floor(basePrice * 0.92)}`, url: `https://www.amazon.in/s?k=${encodeURIComponent(productName)}` },
      { name: 'Nykaa', price: `₹${basePrice}`, url: `https://www.nykaa.com/search/result/?q=${encodeURIComponent(productName)}` },
      { name: 'Flipkart', price: `₹${Math.floor(basePrice * 0.95)}`, url: `https://www.flipkart.com/search?q=${encodeURIComponent(productName)}` },
      { name: 'Myntra', price: `₹${Math.floor(basePrice * 0.98)}`, url: `https://www.myntra.com/${encodeURIComponent(productName)}` },
      { name: 'Purplle', price: `₹${Math.floor(basePrice * 0.90)}`, url: `https://www.purplle.com/search?q=${encodeURIComponent(productName)}` },
      { name: 'Tira', price: `₹${basePrice}`, url: `https://www.tirabeauty.com/search?q=${encodeURIComponent(productName)}` }
    ];

    setTimeout(() => {
      res.json(stores);
    }, 800); 

  } catch (error) {
    console.error("Price Generation Error:", error);
    res.status(500).json({ error: "Failed to fetch prices." });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});