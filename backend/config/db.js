const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('// SEARCHING FOR LOCAL MONGODB DATABASE SERVER...');
    
    // Set a short timeout (2 seconds) so it falls back quickly if MongoDB is offline
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cyber_risk_heatmap', {
      serverSelectionTimeoutMS: 2000,
    });

    console.log('// CONNECTION ESTABLISHED: Standard MongoDB Server Connected');
    global.useMockDb = false;
  } catch (error) {
    console.log(`// DATABASE CONNECTION FAULT: ${error.message}`);
    console.log('// REDIRECTING ROUTING PATHS TO IN-MEMORY MOCK DATABASE ENGINE');
    global.useMockDb = true;
  }
};

module.exports = connectDB;
