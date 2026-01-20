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
  const token = req.cookies.token; // Retrieve token from cookies
  console.log('Received token from cookies:', token); // Debugging log
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const { data: supabaseUser, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !supabaseUser || !supabaseUser.user) {
      console.log('Invalid token or user not found:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }

    console.log('Supabase user verified:', supabaseUser);

    const supabaseId = supabaseUser.user.id; // Extract the Supabase user ID
    console.log('Supabase user ID:', supabaseId); // Debugging log

    // Fetch the user from Prisma
    const prismaUser = await prisma.user.findUnique({
      where: { supabaseId },
    });

    if (!prismaUser) {
      console.error('User not found in Prisma database');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Prisma user verified:', prismaUser);

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
      roleModel = await prisma.farmer.create({
        data: { name, email, password, status: 'Active' },
      });
    } else if (normalizedRole === 'Q_GRADER') {
      roleModel = await prisma.qGrader.create({
        data: { name, email, password, status: 'Active' },
      });
    } else if (normalizedRole === 'HEAD_JUDGE') {
      roleModel = await prisma.headJudge.create({
        data: { name, email, password, status: 'Active' },
      });
    } else if (normalizedRole === 'ADMIN') {
      roleModel = await prisma.admin.create({
        data: { name, email, password },
      });
    } else {
      console.error('Invalid role specified:', role);
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    console.log('User added to Prisma role model:', roleModel);

    // Replace placeholder with actual email-sending logic
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
      text: `Hi ${name},

You have been invited to join our platform as a ${role}.

Your login credentials are:
Email: ${email}
Password: ${password}

Please confirm your email address by clicking the link below:

${process.env.APP_URL}/confirm-email?email=${email}

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

// Admin endpoint to confirm a user's email and activate them
app.post('/api/users/:id/confirm', verifySupabaseToken, verifyRole('ADMIN'), async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Confirm the user in Supabase
    const { error: supabaseError } = await supabase.auth.admin.updateUserById(user.supabaseId, {
      email_confirm: true,
    });
    if (supabaseError) {
      console.error('Error confirming user in Supabase:', supabaseError);
      return res.status(500).json({ message: 'Failed to confirm user in Supabase' });
    }

    // Update Prisma user status
    const updated = await prisma.user.update({ where: { id: parseInt(id) }, data: { status: 'Active' } });
    res.json({ message: 'User confirmed', user: updated });
  } catch (error) {
    console.error('Error confirming user:', error);
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
        // Include participant relations to avoid N+1 queries and to fetch the correct role-specific records
        participants: {
          include: {
            headJudge: true,
            qGrader: true,
            farmer: true,
          },
        },
        samples: true,
      },
    });

    // Refine the events data to include detailed participant information
    const refinedEvents = await Promise.all(
      events.map(async (event) => {
        // Participant relations were preloaded via `include` above, so use them directly
        const participants = event.participants.map((participant) => {
          const userDetails = participant.role === 'HEAD_JUDGE' ? participant.headJudge
            : participant.role === 'Q_GRADER' ? participant.qGrader
            : participant.role === 'FARMER' ? participant.farmer
            : null;

          return { ...participant, userDetails: userDetails || { name: 'N/A' } };
        });

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
    const { assignedQGraderIds, assignedHeadJudgeIds, assignedFarmerIds } = req.body;
    console.log('Received request to update participants for event ID:', id); // Debugging log
    console.log('Request body:', req.body); // Debugging log

    if (!Array.isArray(assignedQGraderIds) || !Array.isArray(assignedHeadJudgeIds) || !Array.isArray(assignedFarmerIds)) {
        return res.status(400).json({ message: 'Invalid data format. assignedQGraderIds, assignedHeadJudgeIds and assignedFarmerIds must be arrays.' });
    }

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
    // Map the authenticated user to a QGrader record using their email
    const userEmail = req.user.email;
    const qGrader = await prisma.qGrader.findUnique({ where: { email: userEmail } });
    if (!qGrader) {
      return res.json([]); // No QGrader record for this user
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
        participants: {
          include: { headJudge: true, qGrader: true, farmer: true },
        },
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

// Update the `/api/cupping-events/headjudge` endpoint to handle the `eventId` parameter
app.get('/api/cupping-events/headjudge', verifySupabaseToken, async (req, res) => {
  try {
    console.log('Fetching Head Judge events for user email:', req.user.email);
    const userEmail = req.user.email;
    const { eventId } = req.query; // Extract eventId from query parameters

    // Find the HeadJudge record for the authenticated user via email
    const headJudge = await prisma.headJudge.findUnique({ where: { email: userEmail } });
    if (!headJudge) {
      return res.json([]);
    }

    // Validate eventId if provided
    if (eventId && isNaN(parseInt(eventId, 10))) {
      return res.status(400).json({ message: 'Invalid eventId. It must be a valid integer.' });
    }

    // Build where clause
    const whereClause = {
      participants: {
        some: {
          role: 'HEAD_JUDGE',
          headJudgeId: headJudge.id,
        },
      },
    };

    if (eventId) whereClause.id = parseInt(eventId, 10);

    // Fetch events
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

    // Map assigned roles using included relations
    const refinedEvents = events.map(event => {
      const assignedHeadJudges = event.participants
        .filter(participant => participant.role === 'HEAD_JUDGE')
        .map(participant => participant.headJudge);
      const assignedQGraders = event.participants
        .filter(participant => participant.role === 'Q_GRADER')
        .map(participant => participant.qGrader);
      return { ...event, assignedHeadJudges, assignedQGraders };
    });

    console.log('Refined events for Head Judge:', refinedEvents);
    const serialized = refinedEvents.map(e => serializeEvent(e));
    res.json(serialized);
  } catch (error) {
    console.error('Error fetching Head Judge events:', error);
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

    // Update the user's status in Prisma to Active
    await prisma.user.update({
      where: { email },
      data: { status: 'Active' },
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
        farmer: true,
            },
        });

        res.json(participants);
    } catch (error) {
        console.error('Error fetching participants:', error);
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