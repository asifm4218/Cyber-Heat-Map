const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Asset = require('../models/Asset');
const Risk = require('../models/Risk');

// Load env variables
dotenv.config();

const seedData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cyber_risk_heatmap');
    console.log('MongoDB Connected for Seeding...');

    // Clear existing data
    await User.deleteMany();
    await Asset.deleteMany();
    await Risk.deleteMany();
    console.log('Cleared existing database entries.');

    // Seed Users
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

    console.log('Seeded Users: admin (admin@cyberrisk.com), user1 (user@cyberrisk.com)');

    // Seed Assets
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

    const seededAssets = await Asset.insertMany(assets);
    console.log(`Seeded ${seededAssets.length} Assets.`);

    // Seed Risks
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

    // Note: Mongoose pre-save triggers on 'create' or 'save', but not insertMany unless we specify it.
    // However, we can map over these and save individually, or assign riskScores manually.
    // Let's create them one by one to ensure the pre-save hook runs and calculates riskScore.
    for (const r of risks) {
      await Risk.create(r);
    }

    console.log('Seeded initial risk items (with risk scores auto-calculated).');
    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding data: ${error.message}`);
    process.exit(1);
  }
};

seedData();
