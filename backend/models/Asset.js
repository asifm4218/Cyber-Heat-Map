const mongoose = require('mongoose');
const { getMockModel } = require('../config/mockDb');

const AssetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide an asset name'],
    trim: true,
    unique: true,
  },
  type: {
    type: String,
    required: [true, 'Please provide an asset type'],
    enum: ['Server', 'Database', 'Network Device', 'Application', 'Workstation', 'Other'],
    default: 'Other',
  },
  department: {
    type: String,
    required: [true, 'Please provide a department'],
    trim: true,
  },
  ipAddress: {
    type: String,
    trim: true,
    default: 'N/A',
  },
  owner: {
    type: String,
    trim: true,
    default: 'Unassigned',
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Retired'],
    default: 'Active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MongooseAsset = mongoose.model('Asset', AssetSchema);

// Proxy interceptor to fall back to local Mock database in case of DB offline
const AssetProxy = new Proxy(MongooseAsset, {
  get(target, prop, receiver) {
    if (global.useMockDb) {
      const mockModel = getMockModel('Asset');
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
      return getMockModel('Asset').constructInstance(...args);
    }
    return Reflect.construct(target, args);
  }
});

module.exports = AssetProxy;
