const mongoose = require('mongoose');
const { getMockModel } = require('../config/mockDb');

const RiskSchema = new mongoose.Schema({
  assetName: {
    type: String,
    required: [true, 'Please provide an asset name'],
    trim: true,
  },
  assetType: {
    type: String,
    required: [true, 'Please provide an asset type'],
  },
  department: {
    type: String,
    required: [true, 'Please provide a department'],
    trim: true,
  },
  threatCategory: {
    type: String,
    required: [true, 'Please provide a threat category'],
    trim: true,
  },
  vulnerability: {
    type: String,
    required: [true, 'Please provide vulnerability details'],
    trim: true,
  },
  likelihood: {
    type: Number,
    required: [true, 'Please provide likelihood rating (1-5)'],
    min: [1, 'Likelihood must be at least 1'],
    max: [5, 'Likelihood cannot exceed 5'],
  },
  impact: {
    type: Number,
    required: [true, 'Please provide impact rating (1-5)'],
    min: [1, 'Impact must be at least 1'],
    max: [5, 'Impact cannot exceed 5'],
  },
  riskScore: {
    type: Number,
  },
  dateReported: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Mitigated'],
    default: 'Pending',
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

// Pre-save hook to automatically calculate riskScore
RiskSchema.pre('save', function (next) {
  this.riskScore = this.likelihood * this.impact;
  next();
});

const MongooseRisk = mongoose.model('Risk', RiskSchema);

// Proxy interceptor to fall back to local Mock database in case of DB offline
const RiskProxy = new Proxy(MongooseRisk, {
  get(target, prop, receiver) {
    if (global.useMockDb) {
      const mockModel = getMockModel('Risk');
      const val = mockModel[prop];
      if (typeof val === 'function') {
        return val.bind(mockModel);
      }
      return val;
    }
    return Reflect.get(target, prop, receiver);
  },
  construct(target, args) {
    if (global.useMockDb) {
      return getMockModel('Risk').constructInstance(...args);
    }
    return Reflect.construct(target, args);
  }
});

module.exports = RiskProxy;
