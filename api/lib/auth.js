/**
 * Fixology Authentication Library
 * JWT tokens, password hashing, and auth middleware
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { readDatabase, writeDatabase, generateUUID, validateEmail } = require('./utils');

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const JWT_SECRET = process.env.JWT_SECRET || 'fixology-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;

// ═══════════════════════════════════════════════════════════════════
// PASSWORD HASHING
// ═══════════════════════════════════════════════════════════════════

async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// ═══════════════════════════════════════════════════════════════════
// JWT TOKEN MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// USER AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════

async function getUsers() {
  const data = await readDatabase('users.json');
  return data.users || [];
}

async function saveUsers(users) {
  await writeDatabase('users.json', { users, updatedAt: new Date().toISOString() });
}

async function findUserByEmail(email) {
  const users = await getUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

async function findUserById(id) {
  const users = await getUsers();
  return users.find(u => u.id === id);
}

async function createUser(userData) {
  const users = await getUsers();
  
  // Check if email already exists
  if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
    throw new Error('Email already registered');
  }
  
  const passwordHash = await hashPassword(userData.password);
  
  const newUser = {
    id: generateUUID(),
    email: userData.email.toLowerCase(),
    passwordHash,
    name: userData.name || '',
    phone: userData.phone || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    plan: 'free',
    rewardsPoints: 0,
    imeiCredits: 5, // Free users get 5 basic checks
    imeiHistory: [],
    diagnosticsHistory: [],
    locationHistory: [],
    preferences: {
      notifications: true,
      newsletter: true
    }
  };
  
  users.push(newUser);
  await saveUsers(users);
  
  // Return user without password hash
  const { passwordHash: _, ...safeUser } = newUser;
  return safeUser;
}

async function authenticateUser(email, password) {
  const user = await findUserByEmail(email);
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  const isValid = await verifyPassword(password, user.passwordHash);
  
  if (!isValid) {
    throw new Error('Invalid email or password');
  }
  
  // Generate token
  const token = generateToken({
    id: user.id,
    email: user.email,
    type: 'user'
  });
  
  // Return user without password hash
  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, token };
}

async function updateUser(userId, updates) {
  const users = await getUsers();
  const index = users.findIndex(u => u.id === userId);
  
  if (index === -1) {
    throw new Error('User not found');
  }
  
  // Don't allow updating sensitive fields directly
  delete updates.id;
  delete updates.passwordHash;
  delete updates.createdAt;
  
  users[index] = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  await saveUsers(users);
  
  const { passwordHash: _, ...safeUser } = users[index];
  return safeUser;
}

async function updateUserPassword(userId, newPassword) {
  const users = await getUsers();
  const index = users.findIndex(u => u.id === userId);
  
  if (index === -1) {
    throw new Error('User not found');
  }
  
  users[index].passwordHash = await hashPassword(newPassword);
  users[index].updatedAt = new Date().toISOString();
  
  await saveUsers(users);
  return true;
}

// ═══════════════════════════════════════════════════════════════════
// SHOP AUTHENTICATION
// ═══════════════════════════════════════════════════════════════════

async function getShops() {
  const data = await readDatabase('shop-users.json');
  return data.shops || [];
}

async function saveShops(shops) {
  await writeDatabase('shop-users.json', { shops, updatedAt: new Date().toISOString() });
}

async function findShopByEmail(email) {
  const shops = await getShops();
  return shops.find(s => s.email.toLowerCase() === email.toLowerCase());
}

async function findShopById(id) {
  const shops = await getShops();
  return shops.find(s => s.id === id);
}

async function createShop(shopData) {
  const shops = await getShops();
  
  // Check if email already exists
  if (shops.some(s => s.email.toLowerCase() === shopData.email.toLowerCase())) {
    throw new Error('Email already registered');
  }
  
  const passwordHash = await hashPassword(shopData.password);
  
  const newShop = {
    id: generateUUID(),
    email: shopData.email.toLowerCase(),
    passwordHash,
    shopName: shopData.shopName || '',
    ownerName: shopData.ownerName || '',
    address: shopData.address || '',
    city: shopData.city || '',
    state: shopData.state || '',
    zipcode: shopData.zipcode || '',
    phone: shopData.phone || '',
    website: shopData.website || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    subscriptionPlan: 'free',
    subscriptionStatus: 'active',
    renewalDate: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    imeiChecksUsed: 0,
    imeiChecksLimit: 10, // Free tier
    diagnosticsUsed: 0,
    websiteEnabled: false,
    websiteSlug: null,
    posUsage: [],
    employees: [],
    businessHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '10:00', close: '16:00' },
      sunday: { open: null, close: null }
    },
    services: [],
    verified: false,
    rating: 0,
    reviewCount: 0
  };
  
  shops.push(newShop);
  await saveShops(shops);
  
  const { passwordHash: _, ...safeShop } = newShop;
  return safeShop;
}

async function authenticateShop(email, password) {
  const shop = await findShopByEmail(email);
  
  if (!shop) {
    throw new Error('Invalid email or password');
  }
  
  const isValid = await verifyPassword(password, shop.passwordHash);
  
  if (!isValid) {
    throw new Error('Invalid email or password');
  }
  
  const token = generateToken({
    id: shop.id,
    email: shop.email,
    shopName: shop.shopName,
    type: 'shop'
  });
  
  const { passwordHash: _, ...safeShop } = shop;
  return { shop: safeShop, token };
}

async function updateShop(shopId, updates) {
  const shops = await getShops();
  const index = shops.findIndex(s => s.id === shopId);
  
  if (index === -1) {
    throw new Error('Shop not found');
  }
  
  delete updates.id;
  delete updates.passwordHash;
  delete updates.createdAt;
  
  shops[index] = {
    ...shops[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  await saveShops(shops);
  
  const { passwordHash: _, ...safeShop } = shops[index];
  return safeShop;
}

// ═══════════════════════════════════════════════════════════════════
// AUTH MIDDLEWARE
// ═══════════════════════════════════════════════════════════════════

async function requireAuth(req, res) {
  const token = extractToken(req);
  
  if (!token) {
    return { error: 'Authentication required', status: 401 };
  }
  
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return { error: 'Invalid or expired token', status: 401 };
  }
  
  if (decoded.type === 'shop') {
    const shop = await findShopById(decoded.id);
    if (!shop) {
      return { error: 'Shop not found', status: 404 };
    }
    const { passwordHash: _, ...safeShop } = shop;
    return { shop: safeShop, type: 'shop' };
  } else {
    const user = await findUserById(decoded.id);
    if (!user) {
      return { error: 'User not found', status: 404 };
    }
    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, type: 'user' };
  }
}

async function requireAdmin(req, res) {
  const auth = await requireAuth(req, res);
  
  if (auth.error) {
    return auth;
  }
  
  const adminEmails = (process.env.ADMIN_EMAILS || 'admin@fixologyai.com').split(',');
  const email = auth.user?.email || auth.shop?.email;
  
  if (!adminEmails.includes(email)) {
    return { error: 'Admin access required', status: 403 };
  }
  
  return auth;
}

// ═══════════════════════════════════════════════════════════════════
// PASSWORD RESET
// ═══════════════════════════════════════════════════════════════════

async function getResetTokens() {
  const data = await readDatabase('reset-tokens.json');
  return data.tokens || [];
}

async function saveResetTokens(tokens) {
  await writeDatabase('reset-tokens.json', { tokens, updatedAt: new Date().toISOString() });
}

async function createResetToken(email, type = 'user') {
  const tokens = await getResetTokens();
  
  // Remove any existing tokens for this email
  const filtered = tokens.filter(t => t.email !== email.toLowerCase());
  
  const token = generateUUID();
  const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour
  
  filtered.push({
    email: email.toLowerCase(),
    token,
    type,
    expires,
    createdAt: new Date().toISOString()
  });
  
  await saveResetTokens(filtered);
  return token;
}

async function validateResetToken(token) {
  const tokens = await getResetTokens();
  const found = tokens.find(t => t.token === token);
  
  if (!found) {
    return null;
  }
  
  if (new Date(found.expires) < new Date()) {
    return null; // Expired
  }
  
  return found;
}

async function consumeResetToken(token) {
  const tokens = await getResetTokens();
  const filtered = tokens.filter(t => t.token !== token);
  await saveResetTokens(filtered);
}

// ═══════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════

module.exports = {
  // Password utilities
  hashPassword,
  verifyPassword,
  
  // JWT utilities
  generateToken,
  verifyToken,
  extractToken,
  
  // User auth
  getUsers,
  findUserByEmail,
  findUserById,
  createUser,
  authenticateUser,
  updateUser,
  updateUserPassword,
  
  // Shop auth
  getShops,
  findShopByEmail,
  findShopById,
  createShop,
  authenticateShop,
  updateShop,
  
  // Middleware
  requireAuth,
  requireAdmin,
  
  // Password reset
  createResetToken,
  validateResetToken,
  consumeResetToken
};

