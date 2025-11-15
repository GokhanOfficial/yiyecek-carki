const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const FOODS_FILE = path.join(DATA_DIR, 'foods.json');
const CODES_FILE = path.join(DATA_DIR, 'codes.json');

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.CORS_ORIGINS === '*' ? '*' : process.env.CORS_ORIGINS.split(','),
  credentials: true
}));

app.use(express.json());
app.use(express.static('public'));

// Rate limiting for spin endpoint
const spinLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10,
  message: { error: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Helper functions for data management
async function ensureDataFiles() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }

  // Initialize foods.json if not exists
  try {
    await fs.access(FOODS_FILE);
  } catch {
    const defaultFoods = {
      foods: [
        { id: 'food_1', name: 'Frambuazlı Biscolata', weight: 12, color: '#FF6B9D' },
        { id: 'food_2', name: 'Haribo', weight: 12, color: '#C44569' },
        { id: 'food_3', name: 'Brownie Intense', weight: 17, color: '#F8B195' },
        { id: 'food_4', name: 'Eti Canga', weight: 17, color: '#F67280' },
        { id: 'food_5', name: 'Eti Wanted Hindistan Cevizli', weight: 21, color: '#355C7D' },
        { id: 'food_6', name: 'Ülker Piko', weight: 21, color: '#6C5B7B' }
      ],
      totalWeight: 100,
      lastUpdated: new Date().toISOString()
    };
    await fs.writeFile(FOODS_FILE, JSON.stringify(defaultFoods, null, 2));
  }

  // Initialize codes.json if not exists
  try {
    await fs.access(CODES_FILE);
  } catch {
    await fs.writeFile(CODES_FILE, JSON.stringify({ codes: [] }, null, 2));
  }
}

async function readJSON(filepath) {
  const data = await fs.readFile(filepath, 'utf8');
  return JSON.parse(data);
}

async function writeJSON(filepath, data) {
  await fs.writeFile(filepath, JSON.stringify(data, null, 2));
}

function generateUniqueCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Admin authentication middleware
function authenticateAdmin(req, res, next) {
  const password = req.headers['x-admin-password'];
  if (password === process.env.ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: 'Yetkisiz erişim' });
  }
}

// PUBLIC API ENDPOINTS

// Get foods configuration
app.get('/api/foods', async (req, res) => {
  try {
    const data = await readJSON(FOODS_FILE);
    res.json(data.foods);
  } catch (error) {
    console.error('Error reading foods:', error);
    res.status(500).json({ error: 'Yiyecekler yüklenemedi' });
  }
});

// Validate code
app.get('/api/validate-code/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const data = await readJSON(CODES_FILE);
    const codeEntry = data.codes.find(c => c.code === code);
    
    if (!codeEntry) {
      return res.json({ valid: false, message: 'Geçersiz kod' });
    }

    if (codeEntry.usedCount >= codeEntry.maxSpins) {
      const wonPrize = codeEntry.spins && codeEntry.spins.length > 0 ? codeEntry.spins[0].wonItem : null;
      return res.json({ 
        valid: false, 
        message: 'Bu kod zaten kullanılmış',
        wonPrize: wonPrize
      });
    }

    res.json({ valid: true, message: 'Kod geçerli' });
  } catch (error) {
    console.error('Error validating code:', error);
    res.status(500).json({ error: 'Kod doğrulanamadı' });
  }
});

// Spin the wheel
app.post('/api/spin', spinLimiter, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Kod gerekli' });
    }

    // Read codes
    const codesData = await readJSON(CODES_FILE);
    const codeEntry = codesData.codes.find(c => c.code === code);

    if (!codeEntry) {
      return res.status(404).json({ error: 'Geçersiz kod' });
    }

    if (codeEntry.usedCount >= codeEntry.maxSpins) {
      return res.status(400).json({ error: 'Bu kod zaten kullanılmış' });
    }

    // Read foods and calculate winner
    const foodsData = await readJSON(FOODS_FILE);
    const foods = foodsData.foods;
    
    const totalWeight = foods.reduce((sum, food) => sum + food.weight, 0);
    let random = Math.random() * totalWeight;
    
    let winner = foods[foods.length - 1];
    for (const food of foods) {
      random -= food.weight;
      if (random <= 0) {
        winner = food;
        break;
      }
    }

    // Record the spin
    const spinRecord = {
      timestamp: new Date().toISOString(),
      wonItem: winner.name,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || 'Unknown'
    };

    if (!codeEntry.spins) {
      codeEntry.spins = [];
    }
    codeEntry.spins.push(spinRecord);
    codeEntry.usedCount = codeEntry.spins.length;

    await writeJSON(CODES_FILE, codesData);

    res.json({
      success: true,
      winner: winner,
      message: `Tebrikler! ${winner.name} kazandınız!`
    });

  } catch (error) {
    console.error('Error during spin:', error);
    res.status(500).json({ error: 'Çark çevrilemedi' });
  }
});

// ADMIN API ENDPOINTS

// Admin authentication
app.post('/api/admin/auth', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    res.json({ success: true, message: 'Giriş başarılı' });
  } else {
    res.status(401).json({ error: 'Hatalı şifre' });
  }
});

// Get all foods (admin)
app.get('/api/admin/foods', authenticateAdmin, async (req, res) => {
  try {
    const data = await readJSON(FOODS_FILE);
    res.json(data);
  } catch (error) {
    console.error('Error reading foods:', error);
    res.status(500).json({ error: 'Yiyecekler yüklenemedi' });
  }
});

// Update foods
app.put('/api/admin/foods', authenticateAdmin, async (req, res) => {
  try {
    const { foods } = req.body;
    
    // Validate total weight
    const totalWeight = foods.reduce((sum, food) => sum + food.weight, 0);
    
    const data = {
      foods,
      totalWeight,
      lastUpdated: new Date().toISOString()
    };
    
    await writeJSON(FOODS_FILE, data);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating foods:', error);
    res.status(500).json({ error: 'Yiyecekler güncellenemedi' });
  }
});

// Get all codes
app.get('/api/admin/codes', authenticateAdmin, async (req, res) => {
  try {
    const data = await readJSON(CODES_FILE);
    res.json(data.codes);
  } catch (error) {
    console.error('Error reading codes:', error);
    res.status(500).json({ error: 'Kodlar yüklenemedi' });
  }
});

// Generate new code
app.post('/api/admin/codes/generate', authenticateAdmin, async (req, res) => {
  try {
    const { name, maxSpins } = req.body;
    const data = await readJSON(CODES_FILE);
    
    let code;
    let attempts = 0;
    do {
      code = generateUniqueCode();
      attempts++;
    } while (data.codes.find(c => c.code === code) && attempts < 10);

    const newCode = {
      code,
      name: name || `Kod ${data.codes.length + 1}`,
      createdAt: new Date().toISOString(),
      maxSpins: maxSpins || 1,
      usedCount: 0,
      spins: []
    };

    data.codes.push(newCode);
    await writeJSON(CODES_FILE, data);

    res.json({ success: true, code: newCode });
  } catch (error) {
    console.error('Error generating code:', error);
    res.status(500).json({ error: 'Kod oluşturulamadı' });
  }
});

// Update code name
app.put('/api/admin/codes/:code', authenticateAdmin, async (req, res) => {
  try {
    const { code } = req.params;
    const { name } = req.body;
    const data = await readJSON(CODES_FILE);
    
    const codeEntry = data.codes.find(c => c.code === code);
    if (!codeEntry) {
      return res.status(404).json({ error: 'Kod bulunamadı' });
    }

    codeEntry.name = name;
    await writeJSON(CODES_FILE, data);

    res.json({ success: true, code: codeEntry });
  } catch (error) {
    console.error('Error updating code:', error);
    res.status(500).json({ error: 'Kod güncellenemedi' });
  }
});

// Delete code
app.delete('/api/admin/codes/:code', authenticateAdmin, async (req, res) => {
  try {
    const { code } = req.params;
    const data = await readJSON(CODES_FILE);
    
    const index = data.codes.findIndex(c => c.code === code);
    if (index === -1) {
      return res.status(404).json({ error: 'Kod bulunamadı' });
    }

    data.codes.splice(index, 1);
    await writeJSON(CODES_FILE, data);

    res.json({ success: true, message: 'Kod silindi' });
  } catch (error) {
    console.error('Error deleting code:', error);
    res.status(500).json({ error: 'Kod silinemedi' });
  }
});

// Get statistics
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
  try {
    const codesData = await readJSON(CODES_FILE);
    const foodsData = await readJSON(FOODS_FILE);
    
    const totalCodes = codesData.codes.length;
    const totalSpins = codesData.codes.reduce((sum, code) => sum + code.usedCount, 0);
    
    // Calculate most won item
    const itemCounts = {};
    codesData.codes.forEach(code => {
      if (code.spins) {
        code.spins.forEach(spin => {
          itemCounts[spin.wonItem] = (itemCounts[spin.wonItem] || 0) + 1;
        });
      }
    });
    
    const mostWonItem = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];
    
    // Last 24 hours activity
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    let last24Hours = 0;
    codesData.codes.forEach(code => {
      if (code.spins) {
        last24Hours += code.spins.filter(spin => 
          new Date(spin.timestamp) > oneDayAgo
        ).length;
      }
    });

    res.json({
      totalCodes,
      totalSpins,
      mostWonItem: mostWonItem ? { name: mostWonItem[0], count: mostWonItem[1] } : null,
      last24Hours,
      totalFoods: foodsData.foods.length
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'İstatistikler yüklenemedi' });
  }
});

// Initialize and start server
async function startServer() {
  try {
    await ensureDataFiles();
    app.listen(PORT, () => {
      console.log(`🎯 Yiyecek Çarkı sunucusu ${PORT} portunda çalışıyor`);
      console.log(`📊 Admin paneli: http://localhost:${PORT}/admin/`);
      console.log(`🎡 Çark sayfası: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('Server başlatılamadı:', error);
    process.exit(1);
  }
}

startServer();
