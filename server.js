import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import cookieParser from 'cookie-parser';
import nodemailer from 'nodemailer';

const app = express();
const prisma = new PrismaClient();

// Initialize Supabase Admin Client from environment variables
const supabaseUrl = process.env.SUPABASE_URL || 'https://mbmilbbdjywnmagxfcyg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_fTKNdqnbnz3XTOaM_LOusA_JIMpfxdk';
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const supabase = createClient(supabaseUrl, supabaseServiceKey); // Correctly initialize Supabase client

// Add CORS middleware to allow requests from the frontend
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const corsOptions = {
  origin: FRONTEND_URL, // Allow requests from the frontend (Vite default 5173)
  credentials: true, // Allow cookies to be sent
};

app.use(cors(corsOptions));
app.use(cookieParser()); // Add cookie parser middleware

// Middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', FRONTEND_URL);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

// Middleware to set Content Security Policy headers
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; connect-src 'self' " + FRONTEND_URL + ";");
  next();
});

// Helper: serialize/normalize cupping event for frontend compatibility
function serializeEvent(event) {
  if (!event) return event;

  // Ensure legacy `is` field is respected if present
  const isResults = event.isResultsRevealed !== undefined ? event.isResultsRevealed : (event.is !== undefined ? event.is : false);
  const sampleIds = (event.samples || []).map(s => String(s.id));

  // Participants may reference qGraderId or headJudgeId
  const assignedQGraderIds = (event.participants || [])
    .filter(p => p.role === 'Q_GRADER' && (p.qGraderId || p.qGraderId === 0))
    .map(p => String(p.qGraderId));
  const assignedHeadJudgeIds = (event.participants || [])
    .filter(p => p.role === 'HEAD_JUDGE' && (p.headJudgeId || p.headJudgeId === 0))
    .map(p => String(p.headJudgeId));
  const assignedFarmerIds = (event.participants || [])
    .filter(p => p.role === 'FARMER' && (p.farmerId || p.farmerId === 0))
    .map(p => String(p.farmerId));

  // Convert numeric id to string for frontend consistency
  const normalized = {
    ...event,
    id: String(event.id),
    sampleIds,
    assignedQGraderIds,
    assignedHeadJudgeIds,
    assignedFarmerIds,
    isResultsRevealed: isResults,
  };

  return normalized;
}

// Middleware to verify Supabase tokens
const verifySupabaseToken = async (req, res, next) => {
  // Retrieve token from cookie `token`, or fallback to Authorization: Bearer <token>
  let token = req.cookies && req.cookies.token;
  if (!token && req.headers && req.headers.authorization) {
    const auth = req.headers.authorization;
    if (auth.startsWith('Bearer ')) token = auth.slice('Bearer '.length);
  }
  console.log('Auth token provided (present?):', !!token, token ? `masked=${token.slice(0,8)}...(len=${token.length})` : 'no-token');
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const { data: supabaseUser, error } = await supabaseAdmin.auth.getUser(token);
    console.log('Supabase getUser response:', { error: error ? (error.message || error) : null, hasUser: !!(supabaseUser && supabaseUser.user) });
    if (error || !supabaseUser || !supabaseUser.user) {
      console.log('Invalid token or user not found returned from Supabase:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }

    console.log('Supabase user verified (partial):', { id: supabaseUser.user.id, email: supabaseUser.user.email });

    const supabaseId = supabaseUser.user.id; // Extract the Supabase user ID

    // Fetch the user from Prisma
    const prismaUser = await prisma.user.findUnique({ where: { supabaseId } });
    console.log('Prisma lookup result for supabaseId:', supabaseId, prismaUser ? { id: prismaUser.id, email: prismaUser.email, role: prismaUser.role } : null);
    if (!prismaUser) {
      console.error('User not found in Prisma database for supabaseId:', supabaseId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Prisma user verified:', { id: prismaUser.id, email: prismaUser.email, role: prismaUser.role });

    req.user = prismaUser; // Attach Prisma user info to the request
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ message: 'Token verification failed' });
  }
};

// Update the `verifyRole` middleware to handle roles array
const verifyRole = (requiredRole) => (req, res, next) => {
  const roles = Array.isArray(req.user.roles) ? req.user.roles : [req.user.role]; // Normalize roles
  if (!roles.includes(requiredRole)) {
    return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
  }
  next();
};

// Add a route for GET /
app.get('/', (req, res) => {
  console.log('GET / route accessed');
  res.send('Server is running!');
});

// Link Supabase users to Prisma database
app.post('/api/link-user', verifySupabaseToken, async (req, res) => {
  const { id, email } = req.user;

  try {
    console.log('Linking user to Prisma:', { id, email }); // Debugging log
    const user = await prisma.user.upsert({
      where: { supabaseId: id },
      update: {},
      create: { supabaseId: id, email },
    });

    console.log('User linked to Prisma:', user); // Debugging log
    res.json(user);
  } catch (error) {
    console.error('Error linking user to Prisma:', error); // Debugging log
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Example: Protected route
app.get('/api/protected-route', verifySupabaseToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Head Judge login endpoint
app.post('/api/headjudge/login', async (req, res) => {
  console.log('Head Judge login attempt:', req.body);
  const { email, password } = req.body;
  try {
    const headJudge = await prisma.headJudge.findUnique({
      where: { email },
    });
    console.log('Database query result:', headJudge);
    if (!headJudge) {
      return res.status(404).json({ message: 'Head Judge not found' });
    }
    if (headJudge.password !== password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Ensure the name field is populated during login
    if (!headJudge.name || headJudge.name.trim() === '') {
      headJudge.name = 'Head Judge'; // Default name if empty
    }

    console.log('Login successful:', { id: headJudge.id, name: headJudge.name, email: headJudge.email });

    res.json({
      id: headJudge.id,
      name: headJudge.name,
      email: headJudge.email,
    });
  } catch (error) {
    console.error('Error during Head Judge login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Farmer login endpoint
app.post('/api/farmer/login', async (req, res) => {
  console.log('Farmer login attempt:', req.body);
  const { email, password } = req.body;

  try {
    const farmer = await prisma.farmer.findUnique({ where: { email } });

    if (!farmer || farmer.password !== password) {
      console.log('Farmer not found or invalid password');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update lastLogin field
    await prisma.farmer.update({
      where: { email },
      data: { lastLogin: new Date() },
    });

    console.log('Farmer login successful:', farmer);
    res.status(200).json(farmer);
  } catch (error) {
    console.error('Error during farmer login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// QGrader login endpoint
app.post('/api/qgrader/login', async (req, res) => {
  console.log('QGrader login attempt:', req.body);
  const { email, password } = req.body;

  try {
    const qGrader = await prisma.qGrader.findUnique({ where: { email } });

    if (!qGrader || qGrader.password !== password) {
      console.log('QGrader not found or invalid password');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update lastLogin field
    await prisma.qGrader.update({
      where: { email },
      data: { lastLogin: new Date() },
    });

    console.log('QGrader login successful:', qGrader);
    res.status(200).json(qGrader);
  } catch (error) {
    console.error('Error during QGrader login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to verify authentication
app.get('/api/auth/verify', verifySupabaseToken, (req, res) => {
  console.log('Token is valid, user:', req.user); // Debugging log

  // Convert single role to roles array for compatibility
  const userWithRoles = {
    ...req.user,
    roles: [req.user.role],
  };

  res.json(userWithRoles);
});

// Add logging to the `/api/test` endpoint
app.get('/api/test', (req, res) => {
  console.log('GET /api/test route accessed');
  res.json({ message: 'Server is running and reachable!' });
});

// Fetch all users
app.get('/api/users', verifySupabaseToken, verifyRole('ADMIN'), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true, // Ensure role is fetched
        createdAt: true,
        updatedAt: true,
        name: true, // Include name field
        status: true, // Include status field
        supabaseId: true, // Include supabaseId for validation
      },
    });

    // Fetch last login and roles from Supabase for each user
    const enrichedUsers = await Promise.all(
      users.map(async (user) => {
        // Validate supabaseId
        const isValidUUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(user.supabaseId);
        if (!isValidUUID) {
          console.warn(`Invalid supabaseId for user ${user.email}: ${user.supabaseId}`);
          return {
            ...user,
            name: user.name || 'Unknown',
            status: user.status || 'Inactive',
            lastLogin: 'N/A',
            roles: [user.role], // Default to Prisma role
          };
        }

        const { data: supabaseUser, error } = await supabase.auth.admin.getUserById(user.supabaseId);
        if (error) {
          console.error(`Error fetching last login for user ${user.email}:`, error);
        }
        return {
          ...user,
          name: user.name || 'Unknown',
          status: user.status || 'Inactive',
          lastLogin: supabaseUser?.last_sign_in_at || 'N/A',
          roles: supabaseUser?.user_metadata?.roles || [user.role], // Fetch roles from Supabase metadata
        };
      })
    );

    res.json(enrichedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new user
app.post('/api/users', verifySupabaseToken, verifyRole('ADMIN'), async (req, res) => {
  const { name, email, password, role } = req.body;

  // Debugging log: Inspect the incoming request payload
  console.log('Received payload for /api/users:', req.body);

  if (!name || !email || !password || !role) {
    console.error('Validation failed: Missing required fields');
    return res.status(400).json({ message: 'Name, email, password, and role are required' });
  }

  try {
    console.log('Attempting to create user in Supabase with email:', email);

    const { data: supabaseUser, error: supabaseError } = await supabase.auth.admin.createUser({
      email,
      password,
    });

    // Debugging log: Inspect the response from Supabase
    console.log('Supabase response:', { supabaseUser, supabaseError });

    if (supabaseError) {
      console.error('Error creating user in Supabase:', supabaseError.message);
      return res.status(500).json({
        message: 'Failed to create user in Supabase.',
        details: supabaseError.message,
      });
    }

    console.log('User created in Supabase:', supabaseUser.user);

    // Normalize the role to match the Prisma Role enum
    const normalizedRole = role.toUpperCase();

    // Create user in Prisma User model
    const prismaUser = await prisma.user.create({
      data: {
        email,
        supabaseId: supabaseUser.user.id,
        role: normalizedRole,
      },
    });

    console.log('User added to Prisma User model:', prismaUser);

    // Auto-generate publicId per role
    let roleModel;
    if (normalizedRole === 'FARMER') {
      const count = await prisma.farmer.count();
      roleModel = await prisma.farmer.create({
        data: { name, email, password, status: 'Active' },
      });
    } else if (normalizedRole === 'Q_GRADER') {
      const count = await prisma.qGrader.count();
      roleModel = await prisma.qGrader.create({
        data: { name, email, password, status: 'Active' },
      });
    } else if (normalizedRole === 'HEAD_JUDGE') {
      const count = await prisma.headJudge.count();
      roleModel = await prisma.headJudge.create({
        data: { name, email, password, status: 'Active' },
      });
    } else if (normalizedRole === 'ADMIN') {
      const count = await prisma.admin.count();
      roleModel = await prisma.admin.create({
        data: { name, email, password },
      });
    } else {
      console.error('Invalid role specified:', role);
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    console.log('User added to Prisma role model:', roleModel);

    // Update Prisma `user` record with provided name and status (if any)
    try {
      await prisma.user.update({ where: { id: prismaUser.id }, data: { name: name || prismaUser.name, status: req.body.status || prismaUser.status } });
    } catch (err) {
      console.error('Failed to update Prisma user with name/status (continuing):', err);
    }

    // If the admin created the user with status 'Active', mark their Supabase email as confirmed
    if (req.body.status === 'Active') {
      try {
        const { error: confirmErr } = await supabase.auth.admin.updateUserById(prismaUser.supabaseId, { email_confirm: true });
        if (confirmErr) {
          console.error('Failed to auto-confirm email in Supabase (continuing):', confirmErr);
        } else {
          console.log('Email auto-confirmed in Supabase for', prismaUser.email);
        }
      } catch (err) {
        console.error('Unexpected error while auto-confirming email (continuing):', err);
      }
    }

    // Send an invitation email, but don't let email errors fail the whole request
    try {
      console.log('Preparing to send invitation email to', email);
      const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject: 'Welcome to the Platform',
        text: `Hi ${name},\n\nYou have been invited to join our platform as a ${role}.\n\nYour login credentials are:\nEmail: ${email}\nPassword: ${password}\n\nPlease confirm your email address by clicking the link below:\n\n${process.env.APP_URL}/confirm-email?email=${email}\n\nPlease log in and change your password after your first login.\n\nBest regards,\nThe Team`,
      };

      // Use Promise wrapper so we can await and catch any errors
      await new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (err, info) => {
          if (err) return reject(err);
          resolve(info);
        });
      }).then(info => console.log('Email sent successfully:', info))
        .catch(err => console.error('Email send failed (continuing):', err));
    } catch (mailErr) {
      console.error('Unexpected error while attempting to send invitation email:', mailErr);
    }

    res.status(201).json({
      message: 'User created successfully.',
      user: prismaUser,
      roleModel,
    });
  } catch (error) {
    console.error('Unexpected error in /api/users:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Update a user
app.put('/api/users/:id', verifySupabaseToken, verifyRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  const { name, status } = req.body;

  if (!name || !status) {
    return res.status(400).json({ message: 'Name and status are required.' });
  }

  try {
    // Update the user's status in Prisma
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { name, status },
    });

    // Update the user's email confirmation status in Supabase based on the status
    if (status === 'Active') {
      const { error: supabaseError } = await supabase.auth.admin.updateUserById(updatedUser.supabaseId, {
        email_confirm: true,
      });

      if (supabaseError) {
        console.error('Error confirming email in Supabase:', supabaseError);
        return res.status(500).json({ message: 'Failed to confirm email in Supabase.' });
      }
    } else if (status === 'Inactive') {
      const { error: supabaseError } = await supabase.auth.admin.updateUserById(updatedUser.supabaseId, {
        email_confirm: false,
      });

      if (supabaseError) {
        console.error('Error deactivating user in Supabase:', supabaseError);
        return res.status(500).json({ message: 'Failed to deactivate user in Supabase.' });
      }
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a user
app.delete('/api/users/:id', verifySupabaseToken, verifyRole('ADMIN'), async (req, res) => {
  const { id } = req.params;

  try {
    // Fetch the user to get the Supabase ID and role
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the user from Supabase
    const { error: supabaseError } = await supabase.auth.admin.deleteUser(user.supabaseId);
    if (supabaseError) {
      console.error('Error deleting user from Supabase:', supabaseError);
      return res.status(500).json({ message: 'Failed to delete user from Supabase' });
    }

    // Delete the user from the respective role model
    if (user.role === 'FARMER') {
      await prisma.farmer.delete({ where: { email: user.email } });
    } else if (user.role === 'Q_GRADER') {
      await prisma.qGrader.delete({ where: { email: user.email } });
    } else if (user.role === 'HEAD_JUDGE') {
      await prisma.headJudge.delete({ where: { email: user.email } });
    } else if (user.role === 'ADMIN') {
      await prisma.admin.delete({ where: { email: user.email } });
    }

    // Delete the user from Prisma User model
    await prisma.user.delete({ where: { id: parseInt(id) } });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Edit a user
app.put('/api/users/:role/:id', verifySupabaseToken, async (req, res) => {
  const { role, id } = req.params;
  const { name, email, status } = req.body;
  try {
    let updatedUser;
    const normalizedRole = role.toLowerCase(); // Normalize role to lowercase
    if (normalizedRole === 'farmer') {
      updatedUser = await prisma.farmer.update({
        where: { id: parseInt(id) },
        data: { name, email, status },
      });
    } else if (normalizedRole === 'qgrader') {
      updatedUser = await prisma.qGrader.update({
        where: { id: parseInt(id) },
        data: { name, email, status },
      });
    } else if (normalizedRole === 'headjudge') {
      updatedUser = await prisma.headJudge.update({
        where: { id: parseInt(id) },
        data: { name, email, status },
      });
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }
    console.log('User updated successfully:', updatedUser);
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a user
app.delete('/api/users/:role/:id', verifySupabaseToken, async (req, res) => {
  const { role, id } = req.params;
  try {
    const normalizedRole = role.toLowerCase(); // Normalize role to lowercase
    if (normalizedRole === 'farmer') {
      await prisma.farmer.delete({ where: { id: parseInt(id) } });
    } else if (normalizedRole === 'qgrader') {
      await prisma.qGrader.delete({ where: { id: parseInt(id) } });
    } else if (normalizedRole === 'headjudge') {
      await prisma.headJudge.delete({ where: { id: parseInt(id) } });
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add endpoints for managing samples
app.get('/api/samples', verifySupabaseToken, async (req, res) => {
  try {
    // Fetch samples
    const samples = await prisma.sample.findMany();
    // Collect unique farmer ids
    const farmerIds = Array.from(new Set(samples.map(s => s.farmerId).filter(id => typeof id === 'number')));
    // Fetch farmers in one query
    const farmers = farmerIds.length > 0
      ? await prisma.farmer.findMany({
          where: { id: { in: farmerIds } },
          select: { id: true, name: true },
        })
      : [];
    const farmerNameById = new Map(farmers.map(f => [f.id, f.name]));
    // Attach farmerName to each sample payload
    const payload = samples.map(s => ({
      ...s,
      farmerName: farmerNameById.get(s.farmerId) || null,
    }));
    res.json(payload);
  } catch (error) {
    console.error('Error fetching samples:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/samples', verifySupabaseToken, async (req, res) => {
  const { farmName, farmerId, region, variety, processingMethod, altitude, moisture, cuppingEventId } = req.body;

  // Validation
  if (!farmName || typeof farmName !== 'string') {
    return res.status(400).json({ message: 'Invalid or missing farmName' });
  }
  if (!farmerId || typeof farmerId !== 'number') {
    return res.status(400).json({ message: 'Invalid or missing farmerId' });
  }
  const normalizedRegion = region && region.trim() !== '' ? region : null;

  if (normalizedRegion === null) {
    console.warn('Region is empty or null, setting to null in the database.');
  }
  if (!variety || typeof variety !== 'string') {
    return res.status(400).json({ message: 'Invalid or missing variety' });
  }
  if (!processingMethod || typeof processingMethod !== 'string') {
    return res.status(400).json({ message: 'Invalid or missing processingMethod' });
  }
  if (typeof altitude !== 'number' || altitude <= 0) {
    return res.status(400).json({ message: 'Invalid or missing altitude' });
  }
  if (typeof moisture !== 'number' || moisture <= 0) {
    return res.status(400).json({ message: 'Invalid or missing moisture' });
  }

  try {
    const sample = await prisma.sample.create({
      data: {
        blindCode: crypto.randomUUID(), // Auto-generate unique blindCode
        farmName,
        farmerId,
        region: normalizedRegion,
        variety,
        processingMethod,
        altitude,
        moisture,
        cuppingEventId,
      },
    });
    res.status(201).json(sample);
  } catch (error) {
    console.error('Error creating sample:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/samples/:id', verifySupabaseToken, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.sample.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Sample deleted successfully' });
  } catch (error) {
    console.error('Error deleting sample:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add an endpoint to fetch admin data
app.get('/api/admin-data', verifySupabaseToken, verifyRole('ADMIN'), async (req, res) => {
  try {
    console.log('Fetching admin data...'); // Log the start of the request

    // Fetch admins from Prisma
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        supabaseId: true, // Include supabaseId for enrichment
      },
    });

    // Enrich admin data with Supabase details
    const enrichedAdmins = await Promise.all(
      admins.map(async (admin) => {
        let supabaseDetails = {};
        try {
          const { data: supabaseUser, error } = await supabase.auth.admin.getUserById(admin.supabaseId);
          if (error) {
            console.error(`Error fetching Supabase details for admin ${admin.email}:`, error);
          } else {
            supabaseDetails = {
              lastLogin: supabaseUser?.last_sign_in_at || 'N/A',
              roles: supabaseUser?.user_metadata?.roles || ['ADMIN'],
            };
          }
        } catch (error) {
          console.error(`Unexpected error fetching Supabase details for admin ${admin.email}:`, error);
        }

        return {
          ...admin,
          ...supabaseDetails,
        };
      })
    );

    console.log('Admin data enriched successfully:', enrichedAdmins); // Log the enriched data
    res.json(enrichedAdmins);
  } catch (error) {
    console.error('Error fetching admin data:', error.message); // Log the error message
    if (error.meta) {
      console.error('Prisma error meta:', JSON.stringify(error.meta, null, 2)); // Log Prisma-specific error metadata
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Add endpoint to save a draft cupping event
app.post('/api/cupping-events/draft', verifySupabaseToken, async (req, res) => {
  const { name, date, description, tags, processingMethods, assignedQGraderIds, assignedHeadJudgeIds, samples, isDraft } = req.body;

  try {
    const draftEvent = await prisma.cuppingEvent.create({
      data: {
        name,
        date: new Date(date),
        description,
        isDraft,
        tags: { create: tags.map(tag => ({ tag })) },
        processingMethods: { create: processingMethods.map(method => ({ method })) },
        participants: {
          create: [
            ...assignedQGraderIds.map(qg => ({ role: 'Q_GRADER', qGraderId: parseInt(qg), eventId: newEvent.id })),
            ...assignedHeadJudgeIds.map(hj => ({ role: 'HEAD_JUDGE', headJudgeId: parseInt(hj), eventId: newEvent.id })),
          ],
        },
        samples: {
          create: samples.map(sample => ({
            blindCode: sample.blindCode || crypto.randomUUID(), // Generate blindCode if missing
            farmerId: sample.farmerId,
            processingMethod: sample.processingMethod,
          })),
        },
      },
    });
    res.status(201).json(draftEvent);
  } catch (error) {
    console.error('Error saving draft event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add validation for tags and processingMethods to ensure they are arrays of strings
const validateTagsAndMethods = (tags, processingMethods) => {
  if (!Array.isArray(tags) || !tags.every(tag => typeof tag === 'string')) {
    return 'Tags must be an array of strings';
  }
  if (!Array.isArray(processingMethods) || !processingMethods.every(method => typeof method === 'string')) {
    return 'Processing methods must be an array of strings';
  }
  return null;
};

// Update the endpoint to include validation
app.post('/api/cupping-events', verifySupabaseToken, async (req, res) => {
  const { name, date, description, tags, processingMethods, assignedQGraderIds, assignedHeadJudgeIds, assignedFarmerIds, samples } = req.body;

  // Validate required fields
  if (!name || !date || !tags || !processingMethods) {
    return res.status(400).json({ message: 'Missing required fields: name, date, tags, or processingMethods' });
  }

  // Validate tags and processingMethods
  const validationError = validateTagsAndMethods(tags, processingMethods);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    console.log('Received request to create cupping event with data:', JSON.stringify(req.body, null, 2)); // Log the incoming request data

    const newEvent = await prisma.cuppingEvent.create({
      data: {
        name,
        date: new Date(date),
        description,
        tags: { create: tags.map(tag => ({ tag })) },
        processingMethods: { create: processingMethods.map(method => ({ method })) },
        samples: {
          create: samples.map(sample => ({
            blindCode: sample.blindCode || crypto.randomUUID(),
            farmerId: parseInt(sample.farmerId),
            processingMethod: sample.processingMethod,
            farmName: sample.farmName,
            variety: sample.variety,
            region: sample.region,
            altitude: sample.altitude,
            moisture: sample.moisture,
          })),
        },
      },
    });

    // Add participants after the event is created
    const participantPayload = [];
    if (Array.isArray(assignedQGraderIds)) participantPayload.push(...assignedQGraderIds.map(qg => ({ role: 'Q_GRADER', qGraderId: parseInt(qg), eventId: newEvent.id })));
    if (Array.isArray(assignedHeadJudgeIds)) participantPayload.push(...assignedHeadJudgeIds.map(hj => ({ role: 'HEAD_JUDGE', headJudgeId: parseInt(hj), eventId: newEvent.id })));
    if (Array.isArray(assignedFarmerIds)) participantPayload.push(...assignedFarmerIds.map(f => ({ role: 'FARMER', farmerId: parseInt(f), eventId: newEvent.id })));
    if (participantPayload.length > 0) {
      await prisma.participant.createMany({ data: participantPayload });
    }

    console.log('Cupping event created successfully:', newEvent); // Log the created event
    res.status(201).json(serializeEvent(newEvent));
  } catch (error) {
    console.error('Error creating cupping event:', error.message); // Log the error message
    if (error.meta) {
      console.error('Prisma error meta:', JSON.stringify(error.meta, null, 2)); // Log Prisma-specific error metadata
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Add endpoint to finalize and activate a draft event
app.put('/api/cupping-events/:id/activate', verifySupabaseToken, async (req, res) => {
  const { id } = req.params;

  try {
    const updatedEvent = await prisma.cuppingEvent.update({
      where: { id: parseInt(id) },
      data: { isDraft: false },
    });
    res.json(serializeEvent(updatedEvent));
  } catch (error) {
    console.error('Error activating event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to fetch all cupping events
app.get('/api/cupping-events', verifySupabaseToken, async (req, res) => {
  try {
    const events = await prisma.cuppingEvent.findMany({
      include: {
        tags: true,
        processingMethods: true,
        participants: true, // Fetch participants without user details
        samples: true,
      },
    });

    // Refine the events data to include detailed participant information
    const refinedEvents = await Promise.all(
      events.map(async (event) => {
        const participants = await Promise.all(
          event.participants.map(async (participant) => {
            let userDetails;
            try {
              if (participant.role === 'HEAD_JUDGE') {
                userDetails = await prisma.headJudge.findUnique({ where: { id: participant.headJudgeId } });
              } else if (participant.role === 'Q_GRADER') {
                userDetails = await prisma.qGrader.findUnique({ where: { id: participant.qGraderId } });
              } else if (participant.role === 'FARMER') {
                userDetails = await prisma.farmer.findUnique({ where: { id: participant.farmerId } });
              }
            } catch (error) {
              console.error(`Error fetching user details for participant ID ${participant.id}:`, error);
            }
            return { ...participant, userDetails: userDetails || { name: 'N/A' } }; // Default to 'N/A' if userDetails is null
          })
        );

        // Compute assignedHeadJudges and assignedQGraders
        const assignedHeadJudges = participants
          .filter((participant) => participant.role === 'HEAD_JUDGE')
          .map((participant) => participant.userDetails);

        const assignedQGraders = participants
          .filter((participant) => participant.role === 'Q_GRADER')
          .map((participant) => participant.userDetails);
        const assignedFarmers = participants
          .filter((participant) => participant.role === 'FARMER')
          .map((participant) => participant.userDetails);

        return { ...event, participants, assignedHeadJudges, assignedQGraders, assignedFarmers };
      })
    );

    // Add sampleCount to each event
    const refinedEventsWithSampleCount = refinedEvents.map(event => ({
      ...event,
      sampleCount: event.samples.length, // Calculate sample count
    }));

    // Serialize events for frontend compatibility (ids as strings, sampleIds, assigned* arrays)
    const serialized = refinedEventsWithSampleCount.map(e => serializeEvent(e));

    res.json(serialized);
  } catch (error) {
    console.error('Error fetching cupping events:', error.message);
    if (error.meta) {
      console.error('Prisma error meta:', JSON.stringify(error.meta, null, 2));
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Endpoint to fetch events assigned to Q Graders
app.get('/api/cupping-events/qgrader', verifySupabaseToken, async (req, res) => {
  try {
    // Map authenticated Prisma user to a QGrader record by email
    const userEmail = req.user?.email;
    if (!userEmail) return res.json([]);

    const qGrader = await prisma.qGrader.findUnique({ where: { email: userEmail } });
    if (!qGrader) {
      return res.json([]);
    }

    const events = await prisma.cuppingEvent.findMany({
      where: {
        participants: {
          some: {
            role: 'Q_GRADER',
            qGraderId: qGrader.id,
          },
        },
      },
      include: {
        tags: true,
        processingMethods: true,
        participants: { include: { headJudge: true, qGrader: true, farmer: true } },
        samples: true,
      },
      orderBy: { date: 'desc' },
    });

    const refinedEvents = events.map(event => {
      const assignedHeadJudges = event.participants
        .filter(p => p.role === 'HEAD_JUDGE')
        .map(p => p.headJudge);
      const assignedQGraders = event.participants
        .filter(p => p.role === 'Q_GRADER')
        .map(p => p.qGrader);
      const sampleObjects = (event.samples || []).map(s => ({ ...s, id: String(s.id) }));
      return { ...event, assignedHeadJudges, assignedQGraders, sampleObjects };
    });

    const serialized = refinedEvents.map(e => serializeEvent(e));
    // Attach sampleObjects to the serialized events so frontend can use full sample data
    const withSamples = serialized.map((ev, idx) => ({ ...ev, sampleObjects: refinedEvents[idx].sampleObjects }));
    res.json(withSamples);
  } catch (error) {
    console.error('Error fetching Q Grader events:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to fetch events assigned to the authenticated Head Judge
app.get('/api/cupping-events/headjudge', verifySupabaseToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    console.log('Fetching Head Judge events for user email:', userEmail);
    const { eventId } = req.query;
    console.log('HeadJudge events query params:', req.query);

    // Validate eventId if provided and non-empty
    if (typeof eventId === 'string' && eventId.trim() !== '' && isNaN(parseInt(eventId, 10))) {
      return res.status(400).json({ message: 'Invalid eventId. It must be a valid integer.' });
    }

    // Find HeadJudge record for the authenticated user
    const headJudge = await prisma.headJudge.findUnique({ where: { email: userEmail } });
    if (!headJudge) {
      // No head judge record — return empty list
      return res.json([]);
    }

    const whereClause = {
      participants: {
        some: {
          role: 'HEAD_JUDGE',
          headJudgeId: headJudge.id,
        },
      },
    };

    if (eventId) whereClause.id = parseInt(eventId, 10);

    const events = await prisma.cuppingEvent.findMany({
      where: whereClause,
      include: {
        tags: true,
        processingMethods: true,
        participants: { include: { headJudge: true, qGrader: true, farmer: true } },
        samples: true,
      },
      orderBy: { date: 'desc' },
    });

    const refinedEvents = events.map(event => {
      const assignedHeadJudges = event.participants
        .filter(p => p.role === 'HEAD_JUDGE')
        .map(p => p.headJudge);
      const assignedQGraders = event.participants
        .filter(p => p.role === 'Q_GRADER')
        .map(p => p.qGrader);
      // Include full sample objects as `sampleObjects` so front-end can render samples without separate fetch
      const sampleObjects = (event.samples || []).map(s => ({ ...s, id: String(s.id) }));
      return { ...event, assignedHeadJudges, assignedQGraders, sampleObjects };
    });

    const serialized = refinedEvents.map(e => serializeEvent(e));
    res.json(serialized);
  } catch (error) {
    console.error('Error fetching Head Judge events:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Fetch a specific cupping event by ID
app.get('/api/cupping-events/:id', verifySupabaseToken, async (req, res) => {
    const { id } = req.params;
    try {
        const eventId = parseInt(id, 10); // Ensure the ID is parsed as an integer
        if (isNaN(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }
        // Debugging log to inspect the ID and query result
        console.log('Fetching cupping event with ID:', eventId);
        const event = await prisma.cuppingEvent.findUnique({
            where: { id: eventId },
            include: {
                tags: true,
                processingMethods: true,
                participants: true,
                samples: true,
            },
        });
        console.log('Query result:', event);
        if (!event) {
            return res.status(404).json({ message: 'Cupping event not found' });
        }
        // Debugging log to inspect the ID and headers
        console.log('Request headers:', req.headers);
        console.log('Request params:', req.params);
        res.json(serializeEvent(event));
    } catch (error) {
        console.error('Error fetching cupping event:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE route to remove a cupping event and its related data
app.delete('/api/cupping-events/:id', verifySupabaseToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Delete the cupping event and cascade delete related data
        await prisma.cuppingEvent.delete({
            where: { id: parseInt(id) },
        });
        res.json({ message: 'Cupping event and related data deleted successfully' });
    } catch (error) {
        console.error('Error deleting cupping event:', error);
        res.status(500).json({ error: 'Failed to delete cupping event' });
    }
});

// Update a cupping event
app.put('/api/cupping-events/:id', verifySupabaseToken, async (req, res) => {
    const { id } = req.params;
    const { name, date, description, tags, processingMethods } = req.body;

    // Validate required fields
    if (!name || !date || !tags || !processingMethods) {
        return res.status(400).json({ message: 'Missing required fields: name, date, tags, or processingMethods' });
    }

    // Validate tags and processingMethods
    const validationError = validateTagsAndMethods(tags, processingMethods);
    if (validationError) {
        return res.status(400).json({ message: validationError });
    }

    // Debugging log to inspect the received payload
    console.log('Received payload for updating event:', req.body);

    try {
        const updatedEvent = await prisma.cuppingEvent.update({
            where: { id: parseInt(id) },
            data: {
                name,
                date: new Date(date),
                description,
                tags: {
                    deleteMany: {}, // Clear existing tags
                    create: tags.map(tag => ({ tag })),
                },
                processingMethods: {
                    deleteMany: {}, // Clear existing processing methods
                    create: processingMethods.map(method => ({ method })),
                },
            },
            include: {
                tags: true,
                processingMethods: true,
            },
        });

        res.json(serializeEvent(updatedEvent));
    } catch (error) {
        console.error('Error updating cupping event:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update participants for a cupping event
app.put('/api/cupping-events/:id/participants', verifySupabaseToken, async (req, res) => {
    const { id } = req.params;
  let { assignedQGraderIds, assignedHeadJudgeIds, assignedFarmerIds } = req.body;
  console.log('Received request to update participants for event ID:', id); // Debugging log
  console.log('Request body:', req.body); // Debugging log

  // Allow clients to send only a subset of arrays (e.g., only QGraders/headJudges)
  if (!Array.isArray(assignedQGraderIds)) assignedQGraderIds = [];
  if (!Array.isArray(assignedHeadJudgeIds)) assignedHeadJudgeIds = [];
  if (!Array.isArray(assignedFarmerIds)) assignedFarmerIds = [];

    try {
        const updatedEvent = await prisma.cuppingEvent.update({
            where: { id: parseInt(id) },
            data: {
                participants: {
                    deleteMany: {}, // Clear existing participants
                    create: [
                        ...assignedQGraderIds.map(qGraderId => ({ role: 'Q_GRADER', qGraderId: parseInt(qGraderId) })),
                        ...assignedHeadJudgeIds.map(headJudgeId => ({ role: 'HEAD_JUDGE', headJudgeId: parseInt(headJudgeId) })),
                        ...assignedFarmerIds.map(farmerId => ({ role: 'FARMER', farmerId: parseInt(farmerId) })),
                    ],
                },
            },
            include: {
                participants: {
                    include: {
                        headJudge: true,
                        qGrader: true,
                        farmer: true,
                    },
                },
            },
        });

        console.log('Updated event participants:', updatedEvent.participants); // Debugging log
        res.json(serializeEvent(updatedEvent));
    } catch (error) {
        console.error('Error updating participants:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Endpoint to fetch events assigned to Q Graders
app.get('/api/cupping-events/qgrader', verifySupabaseToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const events = await prisma.cuppingEvent.findMany({
      where: {
        participants: {
          some: {
            role: 'Q_GRADER',
            userId: userId,
          },
        },
      },
      include: {
        tags: true,
        processingMethods: true,
        participants: true,
        samples: true,
      },
    });
    const serialized = events.map(e => serializeEvent(e));
    res.json(serialized);
  } catch (error) {
    console.error('Error fetching Q Grader events:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/participants', verifySupabaseToken, verifyRole('ADMIN'), async (req, res) => {
  try {
    // Fetch Head Judges directly from the HeadJudge model
    const headJudges = await prisma.headJudge.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Fetch Q Graders directly from the QGrader model
    const qGraders = await prisma.qGrader.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Fetch Farmers directly from the Farmer model
    const farmers = await prisma.farmer.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Enrich the data with roles
    const enrichedHeadJudges = headJudges.map((judge) => ({ ...judge, roles: ['HEAD_JUDGE'] }));
    const enrichedQGraders = qGraders.map((grader) => ({ ...grader, roles: ['Q_GRADER'] }));
    const enrichedFarmers = farmers.map((farmer) => ({ ...farmer, roles: ['FARMER'] }));

    res.json({ headJudges: enrichedHeadJudges, qGraders: enrichedQGraders, farmers: enrichedFarmers });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to fetch all Head Judges
app.get('/api/headjudges', verifySupabaseToken, async (req, res) => {
    try {
        const headJudges = await prisma.headJudge.findMany({
            select: {
                id: true,
                name: true,
                email: true,
            },
        });
        res.json(headJudges);
    } catch (error) {
        console.error('Error fetching Head Judges:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Endpoint to fetch all Q Graders
app.get('/api/qgraders', verifySupabaseToken, async (req, res) => {
    try {
        const qGraders = await prisma.qGrader.findMany({
            select: {
                id: true,
                name: true,
                email: true,
            },
        });
        res.json(qGraders);
    } catch (error) {
        console.error('Error fetching Q Graders:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt with email:', email); // Debugging log

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Supabase login failed:', error.message); // Debugging log
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = data.session?.access_token;
    console.log('Generated token:', token); // Debugging log

    if (token) {
      res.cookie('token', token, {
        httpOnly: true, // Prevent client-side access
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        sameSite: 'strict', // Prevent CSRF attacks
      });
      res.json({ message: 'Login successful' });
    } else {
      console.error('Failed to generate token'); // Debugging log
      res.status(500).json({ message: 'Failed to generate token' });
    }
  } catch (err) {
    console.error('Unexpected error during login:', err); // Debugging log
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token'); // Clear the token cookie
  res.json({ message: 'Logout successful' });
});

app.post('/api/users/invite', verifySupabaseToken, verifyRole('ADMIN'), async (req, res) => {
  const { email, role, password } = req.body;

  if (!email || !role || !password) {
    return res.status(400).json({ message: 'Email, role, and password are required.' });
  }

  try {
    // Step 1: Create the user in Supabase
    const { data: supabaseUser, error: supabaseError } = await supabase.auth.admin.createUser({
      email,
      password,
    });

    if (supabaseError) {
      console.error('Error creating user in Supabase:', supabaseError.message);
      return res.status(500).json({ message: 'Failed to create user in Supabase.' });
    }

    // Step 2: Add the user to the Prisma database
    const prismaUser = await prisma.user.create({
      data: {
        email,
        role,
        supabaseId: supabaseUser.user.id,
      },
    });

    // Step 3: Send an email invitation with the confirmation link
    const confirmationLink = `${process.env.APP_URL}/confirm-email?email=${email}`;
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to the Platform',
      text: `Hi ${prismaUser.name || 'User'},

You have been invited to join our platform as a ${role}.

Your login credentials are:
Email: ${email}
Password: ${password}

Please confirm your email address by clicking the link below:

${confirmationLink}

Please log in and change your password after your first login.

Best regards,
The Team`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent successfully:', info.response);
      }
    });

    res.status(201).json({ message: 'User invited successfully.', user: prismaUser });
  } catch (error) {
    console.error('Error inviting user:', error);
    res.status(500).json({ message: 'An unexpected error occurred.' });
  }
});

// Endpoint to confirm email
app.get('/confirm-email', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: 'Email is required for confirmation.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Update the user's email confirmation status in Supabase
    const { error: supabaseError } = await supabase.auth.admin.updateUserById(user.supabaseId, {
      email_confirm: true,
    });

    if (supabaseError) {
      console.error('Error updating email confirmation in Supabase:', supabaseError);
      return res.status(500).json({ message: 'Failed to update email confirmation in Supabase.' });
    }

    // Update the user's email confirmation status in Prisma
    await prisma.user.update({
      where: { email },
      data: { emailConfirmed: true },
    });

    res.status(200).send('Email confirmed successfully. You can now log in.');
  } catch (error) {
    console.error('Error confirming email:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Add endpoint to handle adding samples to a specific cupping event
app.post('/api/cupping-events/:id/samples', verifySupabaseToken, async (req, res) => {
    const { id } = req.params; // Event ID
    const { samples } = req.body; // Samples data from the request body

    if (!samples || !Array.isArray(samples)) {
        console.error('Validation failed: Missing or invalid samples data');
        return; // Removed the error alert and added a silent return
    }

    // Log missing fields for each sample
    samples.forEach((sample, index) => {
        const missingFields = [];
        if (!sample.farmName) missingFields.push('farmName');
        if (!sample.farmerId || isNaN(parseInt(sample.farmerId))) missingFields.push('farmerId');
        if (!sample.region) missingFields.push('region');
        if (!sample.variety) missingFields.push('variety');
        if (!sample.processingMethod) missingFields.push('processingMethod');
        if (!sample.altitude) missingFields.push('altitude');
        if (!sample.moisture) missingFields.push('moisture');

        if (missingFields.length > 0) {
            console.error(`Sample ${index + 1} is missing required fields: ${missingFields.join(', ')}`);
        }
    });

    try {
        // Check if the event exists
        const event = await prisma.cuppingEvent.findUnique({ where: { id: parseInt(id) } });
        if (!event) {
            return res.status(404).json({ message: 'Cupping event not found' });
        }

        // Add samples to the event
        const createdSamples = await Promise.all(
            samples.map(sample =>
                prisma.sample.create({
                    data: {
                        ...sample,
                        farmerId: parseInt(sample.farmerId), // Ensure farmerId is an integer
                        cuppingEventId: parseInt(id),
                    },
                })
            )
        );
        res.status(201).json(createdSamples);
    } catch (error) {
        console.error('Error adding samples to event:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Add endpoint to fetch samples for a specific cupping event
app.get('/api/cupping-events/:id/samples', verifySupabaseToken, async (req, res) => {
  const { id } = req.params;
  try {
    const eventId = parseInt(id, 10);
    if (isNaN(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    const sampleCount = await prisma.sample.count({
      where: { cuppingEventId: eventId },
    });

    res.json({ sampleCount });
  } catch (error) {
    console.error('Error fetching sample count for cupping event:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to fetch participants for a specific cupping event
app.get('/api/cupping-events/:id/participants', verifySupabaseToken, async (req, res) => {
  const { id } = req.params;
    try {
        const eventId = parseInt(id, 10);
        if (isNaN(eventId)) {
            return res.status(400).json({ message: 'Invalid event ID' });
        }

        const participants = await prisma.participant.findMany({
            where: { eventId: eventId },
            include: {
                headJudge: true,
                qGrader: true,
            },
        });

        res.json(participants);
    } catch (error) {
        console.error('Error fetching participants:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Helper: calculate total from attribute fields and apply defects deduction
function calculateTotal(attrs, defects = 0) {
  const keys = [
    'fragrance',
    'flavor',
    'aftertaste',
    'acidity',
    'body',
    'balance',
    'uniformity',
    'cleanCup',
    'sweetness',
    'overall',
  ];
  let sum = 0;
  for (const k of keys) {
    const v = Number(attrs?.[k] ?? 0);
    if (Number.isNaN(v)) return null;
    sum += v;
  }
  return sum - Number(defects || 0);
}

// Submit or update a Q Grader score for a sample
app.post('/api/qgrader/scores', verifySupabaseToken, async (req, res) => {
  try {
    console.log('POST /api/qgrader/scores called, body:', req.body, 'user:', req.user?.email);
    const { sampleId, cuppingEventId, attributes, defects, comments, descriptors } = req.body;
    if (!sampleId || isNaN(parseInt(sampleId))) return res.status(400).json({ message: 'sampleId is required' });

    // Prevent submitting if sample or event is locked/finalized
    const sampleRecord = await prisma.sample.findUnique({ where: { id: parseInt(sampleId) }, include: { cuppingEvent: true } });
    if (!sampleRecord) {
      console.log('Submission blocked: sample not found', { sampleId });
      return res.status(404).json({ message: 'Sample not found' });
    }
    if (sampleRecord.isLocked) {
      console.log('Submission blocked: sample is locked', { sampleId, sampleRecordId: sampleRecord.id });
      return res.status(403).json({ message: 'Judgement locked for this sample' });
    }
    if (sampleRecord.cuppingEvent && sampleRecord.cuppingEvent.isResultsRevealed) {
      console.log('Submission blocked: results revealed for event', { cuppingEventId: sampleRecord.cuppingEvent.id });
      return res.status(403).json({ message: 'Results are revealed for this event; no further submissions allowed' });
    }

    // Map authenticated Prisma user to a QGrader record by email
    const userEmail = req.user?.email;
    if (!userEmail) {
      console.log('Submission blocked: authenticated req.user missing email', { reqUser: req.user });
      return res.status(403).json({ message: 'Forbidden' });
    }
    let qGrader = await prisma.qGrader.findUnique({ where: { email: userEmail } });
    if (!qGrader) {
      // If the authenticated Prisma `user` exists and has role Q_GRADER, create a qGrader row automatically
      try {
        const prismaUser = req.user; // set in verifySupabaseToken
        if (prismaUser && prismaUser.role === 'Q_GRADER') {
          qGrader = await prisma.qGrader.create({ data: { email: userEmail, password: '', name: prismaUser.name || userEmail, status: 'Active' } });
          console.log('Auto-created QGrader record for', userEmail);
        }
      } catch (err) {
        console.error('Error auto-creating QGrader record:', err);
      }
    }
    if (!qGrader) {
      console.log('Submission blocked: no qGrader record found for user', { userEmail, prismaUserRole: req.user?.role });
      return res.status(403).json({ message: 'Only Q Graders may submit scores' });
    }

    const total = calculateTotal(attributes, defects);
    if (total === null) return res.status(400).json({ message: 'Invalid attribute values' });

    // Upsert behavior: update existing score for this sample by this qGrader, or create a new one.
    // If an existing score is already finalized (`isSubmitted`), reject further edits.
    let score = await prisma.qGraderScore.findFirst({ where: { sampleId: parseInt(sampleId), qGraderId: qGrader.id } });
    if (score) {
      if (score.isSubmitted) {
        console.log('Submission blocked: existing score already submitted by this grader', { scoreId: score.id, qGraderId: qGrader.id });
        return res.status(403).json({ message: 'Score already submitted/finalized by this grader; no further edits allowed' });
      }
      score = await prisma.qGraderScore.update({
        where: { id: score.id },
        data: {
          cuppingEventId: cuppingEventId ? parseInt(cuppingEventId) : undefined,
          fragrance: Number(attributes.fragrance),
          flavor: Number(attributes.flavor),
          aftertaste: Number(attributes.aftertaste),
          acidity: Number(attributes.acidity),
          body: Number(attributes.body),
          balance: Number(attributes.balance),
          uniformity: Number(attributes.uniformity),
          cleanCup: Number(attributes.cleanCup),
          sweetness: Number(attributes.sweetness),
          overall: Number(attributes.overall),
          defects: Number(defects || 0),
          comments: comments || null,
          descriptors: descriptors ? JSON.stringify(descriptors) : null,
          total,
        },
      });
    } else {
      score = await prisma.qGraderScore.create({
        data: {
          sampleId: parseInt(sampleId),
          cuppingEventId: cuppingEventId ? parseInt(cuppingEventId) : undefined,
          qGraderId: qGrader.id,
          fragrance: Number(attributes.fragrance),
          flavor: Number(attributes.flavor),
          aftertaste: Number(attributes.aftertaste),
          acidity: Number(attributes.acidity),
          body: Number(attributes.body),
          balance: Number(attributes.balance),
          uniformity: Number(attributes.uniformity),
          cleanCup: Number(attributes.cleanCup),
          sweetness: Number(attributes.sweetness),
          overall: Number(attributes.overall),
          defects: Number(defects || 0),
          comments: comments || null,
          descriptors: descriptors ? JSON.stringify(descriptors) : null,
          total,
        },
      });
    }

    // Recalculate adjudicatedFinalScore for the sample as the average of all QGrader totals
    const scores = await prisma.qGraderScore.findMany({ where: { sampleId: parseInt(sampleId) } });
    const avg = scores.length > 0 ? scores.reduce((acc, s) => acc + Number(s.total || 0), 0) / scores.length : null;
    if (avg !== null) {
      await prisma.sample.update({ where: { id: parseInt(sampleId) }, data: { adjudicatedFinalScore: avg } });
    }
    
    // Respect per-grader finalization: if the request indicates the grader is finalizing, set isSubmitted
    const { isSubmitted: submitFlag } = req.body;
    if (submitFlag) {
      await prisma.qGraderScore.update({ where: { id: score.id }, data: { isSubmitted: true, submittedAt: new Date() } });
    }

    res.json({ score, adjudicatedFinalScore: avg });
  } catch (error) {
    console.error('Error saving Q Grader score:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Notes: PUT handler removed — POST /api/qgrader/scores performs upsert (create or update)

// Fetch all Q Grader scores for a sample
app.get('/api/qgrader/scores/sample/:sampleId', verifySupabaseToken, async (req, res) => {
  try {
    const { sampleId } = req.params;
    if (!sampleId || isNaN(parseInt(sampleId))) return res.status(400).json({ message: 'Invalid sampleId' });

    const scores = await prisma.qGraderScore.findMany({ where: { sampleId: parseInt(sampleId) }, include: { qGrader: true } });
    res.json(scores);
  } catch (error) {
    console.error('Error fetching scores for sample:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Fetch the authenticated Q Grader's score for a sample (if any)
app.get('/api/qgrader/scores/mine/:sampleId', verifySupabaseToken, async (req, res) => {
  try {
    const { sampleId } = req.params;
    if (!sampleId || isNaN(parseInt(sampleId))) return res.status(400).json({ message: 'Invalid sampleId' });
    const userEmail = req.user?.email;
    if (!userEmail) return res.status(403).json({ message: 'Forbidden' });
    const qGrader = await prisma.qGrader.findUnique({ where: { email: userEmail } });
    if (!qGrader) return res.status(403).json({ message: 'Only Q Graders may access this resource' });

    const score = await prisma.qGraderScore.findFirst({ where: { sampleId: parseInt(sampleId), qGraderId: qGrader.id } });
    res.json(score || null);
  } catch (error) {
    console.error('Error fetching my score for sample:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Fetch all scores submitted by the authenticated Q Grader
app.get('/api/qgrader/scores/mine', verifySupabaseToken, async (req, res) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) return res.status(403).json({ message: 'Forbidden' });
    const qGrader = await prisma.qGrader.findUnique({ where: { email: userEmail } });
    if (!qGrader) return res.status(403).json({ message: 'Only Q Graders may access this resource' });

    const scores = await prisma.qGraderScore.findMany({
      where: { qGraderId: qGrader.id },
      include: { sample: true, cuppingEvent: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(scores);
  } catch (error) {
    console.error('Error fetching my scores:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Head Judge: lock judgement for a specific sample in an event
app.post('/api/headjudge/events/:eventId/samples/:sampleId/lock', verifySupabaseToken, async (req, res) => {
  try {
    const { eventId, sampleId } = req.params;
    console.log('HEADJUDGE LOCK called', { params: req.params, headers: { authorization: req.headers.authorization }, cookieToken: req.cookies && req.cookies.token, body: req.body });
    const userEmail = req.user?.email;
    if (!userEmail) return res.status(403).json({ message: 'Forbidden' });

    const headJudge = await prisma.headJudge.findUnique({ where: { email: userEmail } });
    if (!headJudge) return res.status(403).json({ message: 'Only Head Judges may lock judgement' });

    // Verify this head judge is assigned to this event
    const participant = await prisma.participant.findFirst({ where: { eventId: parseInt(eventId), headJudgeId: headJudge.id, role: 'HEAD_JUDGE' } });
    if (!participant) return res.status(403).json({ message: 'You are not assigned to this event' });

    // Ensure the sample belongs to the event
    const sample = await prisma.sample.findUnique({ where: { id: parseInt(sampleId) } });
    if (!sample || sample.cuppingEventId !== parseInt(eventId)) return res.status(404).json({ message: 'Sample not found for this event' });

    // Lock the sample
    const updatedSample = await prisma.sample.update({ where: { id: parseInt(sampleId) }, data: { isLocked: true, lockedByHeadJudgeId: headJudge.id, lockedAt: new Date() } });

    // Check whether all samples for the event are locked; if so, reveal results for event
    const totalSamples = await prisma.sample.count({ where: { cuppingEventId: parseInt(eventId) } });
    const lockedSamples = await prisma.sample.count({ where: { cuppingEventId: parseInt(eventId), isLocked: true } });
    let revealed = false;
    if (totalSamples > 0 && lockedSamples >= totalSamples) {
      // Reveal results
      await prisma.cuppingEvent.update({ where: { id: parseInt(eventId) }, data: { isResultsRevealed: true } });
      revealed = true;
    }

    res.json({ sample: updatedSample, resultsRevealed: revealed });
  } catch (error) {
    console.error('Error locking sample judgement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Head Judge: create or update adjudication decision for a sample
app.post('/api/headjudge/samples/:sampleId/decision', verifySupabaseToken, async (req, res) => {
  try {
    const { sampleId } = req.params;
    const { finalScore, gradeLevel, notes, lock, flagged } = req.body;
    console.log('HEADJUDGE DECISION called', { params: req.params, headers: { authorization: req.headers.authorization }, cookieToken: req.cookies && req.cookies.token, body: req.body });
    const userEmail = req.user?.email;
    if (!userEmail) return res.status(403).json({ message: 'Forbidden' });

    const headJudge = await prisma.headJudge.findUnique({ where: { email: userEmail } });
    if (!headJudge) return res.status(403).json({ message: 'Only Head Judges may submit decisions' });

    const sample = await prisma.sample.findUnique({ where: { id: parseInt(sampleId) } });
    if (!sample) return res.status(404).json({ message: 'Sample not found' });

    if (!sample.cuppingEventId) return res.status(400).json({ message: 'Sample is not assigned to an event' });

    // Verify head judge assignment to the event
    const participant = await prisma.participant.findFirst({ where: { eventId: sample.cuppingEventId, headJudgeId: headJudge.id, role: 'HEAD_JUDGE' } });
    if (!participant) return res.status(403).json({ message: 'You are not assigned to this event' });

    // Upsert HeadJudgeDecision for this sample and headJudge
    let decision = await prisma.headJudgeDecision.findFirst({ where: { sampleId: parseInt(sampleId), headJudgeId: headJudge.id } });
    if (decision) {
      decision = await prisma.headJudgeDecision.update({ where: { id: decision.id }, data: { finalScore: finalScore ?? decision.finalScore, gradeLevel: gradeLevel ?? decision.gradeLevel, notes: notes ?? decision.notes, flagged: typeof flagged === 'boolean' ? flagged : decision.flagged } });
    } else {
      decision = await prisma.headJudgeDecision.create({ data: { sampleId: parseInt(sampleId), headJudgeId: headJudge.id, finalScore, gradeLevel, notes, flagged: Boolean(flagged) } });
    }

    // Update the Sample record with adjudication summary fields
    const sampleUpdateData = {
      adjudicatedFinalScore: finalScore ?? sample.adjudicatedFinalScore,
      gradeLevel: gradeLevel ?? sample.gradeLevel,
      headJudgeNotes: notes ?? sample.headJudgeNotes,
      adjudicationJustification: notes ?? sample.adjudicationJustification,
      flaggedForDiscussion: typeof flagged === 'boolean' ? flagged : sample.flaggedForDiscussion,
    };

    // If requested, lock the sample
    if (lock) {
      sampleUpdateData.isLocked = true;
      sampleUpdateData.lockedByHeadJudgeId = headJudge.id;
      sampleUpdateData.lockedAt = new Date();
    }

    const updatedSample = await prisma.sample.update({ where: { id: parseInt(sampleId) }, data: sampleUpdateData });

    // If lock was requested, check whether to reveal event results
    let revealed = false;
    if (lock) {
      const totalSamples = await prisma.sample.count({ where: { cuppingEventId: sample.cuppingEventId } });
      const lockedSamples = await prisma.sample.count({ where: { cuppingEventId: sample.cuppingEventId, isLocked: true } });
      if (totalSamples > 0 && lockedSamples >= totalSamples) {
        await prisma.cuppingEvent.update({ where: { id: sample.cuppingEventId }, data: { isResultsRevealed: true } });
        revealed = true;
      }
    }

    res.json({ decision, sample: updatedSample, resultsRevealed: revealed });
  } catch (error) {
    console.error('Error saving head judge decision:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Head Judge: fetch decisions for an event (all samples)
app.get('/api/headjudge/events/:eventId/decisions', verifySupabaseToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userEmail = req.user?.email;
    if (!userEmail) return res.status(403).json({ message: 'Forbidden' });

    const headJudge = await prisma.headJudge.findUnique({ where: { email: userEmail } });
    if (!headJudge) return res.status(403).json({ message: 'Only Head Judges may fetch decisions' });

    // Verify assignment
    const participant = await prisma.participant.findFirst({ where: { eventId: parseInt(eventId), headJudgeId: headJudge.id, role: 'HEAD_JUDGE' } });
    if (!participant) return res.status(403).json({ message: 'You are not assigned to this event' });

    const decisions = await prisma.headJudgeDecision.findMany({ where: { sample: { cuppingEventId: parseInt(eventId) } }, include: { sample: true, headJudge: true } });
    res.json(decisions);
  } catch (error) {
    console.error('Error fetching head judge decisions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Head Judge: fetch submitted QGrader scores for an event (for adjudication)
app.get('/api/headjudge/events/:eventId/scores', verifySupabaseToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    if (!eventId || isNaN(parseInt(eventId))) return res.status(400).json({ message: 'Invalid eventId' });

    const userEmail = req.user?.email;
    if (!userEmail) return res.status(403).json({ message: 'Forbidden' });

    const headJudge = await prisma.headJudge.findUnique({ where: { email: userEmail } });
    if (!headJudge) return res.status(403).json({ message: 'Only Head Judges may fetch event scores' });

    // Verify assignment
    const participant = await prisma.participant.findFirst({ where: { eventId: parseInt(eventId), headJudgeId: headJudge.id, role: 'HEAD_JUDGE' } });
    if (!participant) return res.status(403).json({ message: 'You are not assigned to this event' });

    // Fetch submitted QGrader scores for the event, include grader and sample info
    const scores = await prisma.qGraderScore.findMany({
      where: { cuppingEventId: parseInt(eventId), isSubmitted: true },
      include: { qGrader: true, sample: true },
      orderBy: { createdAt: 'asc' },
    });

    res.json(scores);
  } catch (error) {
    console.error('Error fetching head judge event scores:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    message: 'Internal server error',
  });
});

// Update the server to listen on port 5001
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});