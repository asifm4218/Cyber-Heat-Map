const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/assets', require('./routes/assets'));
app.use('/api/risks', require('./routes/risks'));

// Simple root check
app.get('/', (req, res) => {
  res.json({
    message: 'Cyber Risk Heat Map System API is running...',
    databaseMode: global.useMockDb ? 'In-Memory Mock' : 'Standard MongoDB'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Server Error',
  });
});

const PORT = process.env.PORT || 5000;

// Connect to DB and start listening
const startServer = async () => {
  await connectDB();
  
  // Auto-seed database if empty
  const User = require('./models/User');
  const Asset = require('./models/Asset');
  const Risk = require('./models/Risk');
  
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('// DATABASE INTEGRITY SCAN: No operator credentials detected');
      console.log('// INITIALIZING SEED SEQUENCE: Injecting default catalog parameters...');
      
      // Create users
      const adminUser = await User.create({
        username: 'admin',
        email: 'admin@cyberrisk.com',
        password: 'password123',
        role: 'admin',
      });

      const standardUser = await User.create({
        username: 'user1',
        email: 'user@cyberrisk.com',
        password: 'password123',
        role: 'user',
      });

      // Create assets
      const assets = [
        {
          name: 'Firewall-External',
          type: 'Network Device',
          department: 'IT Infrastructure',
          ipAddress: '10.0.0.1',
          owner: 'Network Admin',
          status: 'Active',
        },
        {
          name: 'Production-DB-Cluster',
          type: 'Database',
          department: 'Finance IT',
          ipAddress: '10.0.2.15',
          owner: 'DB Admin',
          status: 'Active',
        },
        {
          name: 'Employee-Portal',
          type: 'Application',
          department: 'HR Systems',
          ipAddress: '192.168.10.4',
          owner: 'HR Tech Lead',
          status: 'Active',
        },
        {
          name: 'Domain-Controller-01',
          type: 'Server',
          department: 'IT Security',
          ipAddress: '10.0.1.100',
          owner: 'Security Team',
          status: 'Active',
        },
        {
          name: 'Developer-Workstation-Engineering',
          type: 'Workstation',
          department: 'Engineering',
          ipAddress: '192.168.50.33',
          owner: 'Lead Developer',
          status: 'Active',
        },
      ];

      await Asset.insertMany(assets);

      // Create risks
      const risks = [
        {
          assetName: 'Production-DB-Cluster',
          assetType: 'Database',
          department: 'Finance IT',
          threatCategory: 'SQL Injection',
          vulnerability: 'Unsanitized input in billing transaction module allows arbitrary DB query execution.',
          likelihood: 3,
          impact: 5,
          reportedBy: standardUser._id,
          status: 'Pending',
        },
        {
          assetName: 'Firewall-External',
          assetType: 'Network Device',
          department: 'IT Infrastructure',
          threatCategory: 'Outdated Firmware',
          vulnerability: 'Firewall firmware version is 2 years behind, containing CVE-2024-XXXX arbitrary code execution flaw.',
          likelihood: 4,
          impact: 4,
          reportedBy: adminUser._id,
          status: 'Approved',
        },
        {
          assetName: 'Employee-Portal',
          assetType: 'Application',
          department: 'HR Systems',
          threatCategory: 'Weak Passwords',
          vulnerability: 'Authentication allows default passwords without complexity requirements, vulnerable to brute force.',
          likelihood: 5,
          impact: 3,
          reportedBy: standardUser._id,
          status: 'Pending',
        },
        {
          assetName: 'Domain-Controller-01',
          assetType: 'Server',
          department: 'IT Security',
          threatCategory: 'Security Misconfiguration',
          vulnerability: 'NTLMv1 enabled and insecure LDAP signing configured.',
          likelihood: 3,
          impact: 4,
          reportedBy: adminUser._id,
          status: 'Approved',
        },
      ];

      for (const r of risks) {
        await Risk.create(r);
      }
      
      console.log('// SEED SEQUENCE COMPLETE: Telemetry catalog successfully injected');
    } else {
      console.log('// DATABASE INTEGRITY SCAN: Operator records online. Ready.');
    }
  } catch (err) {
    console.error(`// SEED FAULT: ${err.message}`);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`Database engine mode: ${global.useMockDb ? 'IN-MEMORY MOCK' : 'STANDARD MONGODB'}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
  });
};

startServer();
