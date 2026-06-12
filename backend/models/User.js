const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { getMockModel } = require('../config/mockDb');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const MongooseUser = mongoose.model('User', UserSchema);

// Proxy interceptor to fall back to local Mock database in case of DB offline
const UserProxy = new Proxy(MongooseUser, {
  get(target, prop, receiver) {
    if (global.useMockDb) {
      const mockModel = getMockModel('User');
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
      return getMockModel('User').constructInstance(...args);
    }
    return Reflect.construct(target, args);
  }
});

module.exports = UserProxy;
