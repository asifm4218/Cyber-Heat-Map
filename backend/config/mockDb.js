const bcrypt = require('bcryptjs');

// In-Memory Database Store
const store = {
  User: [],
  Asset: [],
  Risk: []
};

// Counter for generating sequential ObjectId-like strings
let idCounter = 1;
const generateId = () => {
  return (idCounter++).toString().padStart(24, '0');
};

class MockQuery {
  constructor(data, modelName, isSingle = false) {
    this.data = JSON.parse(JSON.stringify(data)); // Deep clone to prevent direct mutations
    this.modelName = modelName;
    this.isSingle = isSingle;
  }

  populate(path) {
    if (path === 'reportedBy') {
      this.data = this.data.map(item => {
        if (item.reportedBy) {
          const user = store.User.find(u => u._id.toString() === item.reportedBy.toString());
          if (user) {
            const { password, ...userWithoutPassword } = user;
            return { ...item, reportedBy: userWithoutPassword };
          }
        }
        return item;
      });
    }
    return this;
  }

  sort(options) {
    const key = Object.keys(options)[0];
    const order = options[key];
    this.data.sort((a, b) => {
      let valA = a[key];
      let valB = b[key];
      
      // Convert dates if comparing date fields
      if (key === 'dateReported' || key === 'createdAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return order === 1 ? -1 : 1;
      if (valA > valB) return order === 1 ? 1 : -1;
      return 0;
    });
    return this;
  }

  select(fields) {
    // Stub to support chaining like .select('+password') or .select('-password')
    return this;
  }

  then(onResolve, onReject) {
    let result;
    if (this.isSingle) {
      result = this.data.length > 0 ? new MockDocument(this.modelName, this.data[0]) : null;
    } else {
      result = this.data.map(item => new MockDocument(this.modelName, item));
    }
    return Promise.resolve(result).then(onResolve, onReject);
  }
}

// Emulates a Mongoose document instance
class MockDocument {
  constructor(modelName, data) {
    Object.assign(this, JSON.parse(JSON.stringify(data)));
    if (!this._id) {
      this._id = generateId();
    }
    this._modelName = modelName;
  }

  async save() {
    const records = store[this._modelName];
    const index = records.findIndex(r => r._id.toString() === this._id.toString());
    
    // Auto-calculate risk score for Risk model
    if (this._modelName === 'Risk') {
      this.riskScore = this.likelihood * this.impact;
    }

    // Encrypt password if User and modified/new
    if (this._modelName === 'User' && this.password && !this.password.startsWith('$2a$')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }

    const docData = { ...this };
    delete docData._modelName;

    if (index >= 0) {
      records[index] = docData;
    } else {
      records.push(docData);
    }

    return this;
  }

  async deleteOne() {
    const records = store[this._modelName];
    store[this._modelName] = records.filter(r => r._id.toString() !== this._id.toString());
    return { deletedCount: 1 };
  }

  async matchPassword(enteredPassword) {
    if (this._modelName === 'User' && this.password) {
      return await bcrypt.compare(enteredPassword, this.password);
    }
    return false;
  }
}

// Mock Model Class
class MockModel {
  constructor(modelName) {
    this.modelName = modelName;
  }

  // Instantiates a new document
  constructInstance(data) {
    return new MockDocument(this.modelName, data);
  }

  find(query = {}) {
    let results = store[this.modelName];
    
    // Basic filter match helper (e.g. { name: 'value' })
    results = results.filter(item => {
      for (const key in query) {
        if (query[key] && typeof query[key] === 'object') {
          // Handle $or query logic for auth login/register checks
          if (key === '$or') {
            const matchesOr = query[key].some(orQuery => {
              const orKey = Object.keys(orQuery)[0];
              return item[orKey] === orQuery[orKey];
            });
            if (!matchesOr) return false;
          }
        } else if (item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });

    return new MockQuery(results, this.modelName, false);
  }

  findOne(query = {}) {
    let results = store[this.modelName];
    
    results = results.filter(item => {
      for (const key in query) {
        if (query[key] && typeof query[key] === 'object') {
          // Handle $or query logic for auth login/register checks
          if (key === '$or') {
            const matchesOr = query[key].some(orQuery => {
              const orKey = Object.keys(orQuery)[0];
              return item[orKey] === orQuery[orKey];
            });
            if (!matchesOr) return false;
          }
        } else if (item[key] !== query[key]) {
          return false;
        }
      }
      return true;
    });

    return new MockQuery(results, this.modelName, true);
  }

  findById(id) {
    let results = store[this.modelName];
    if (id) {
      results = results.filter(r => r._id.toString() === id.toString());
    } else {
      results = [];
    }
    return new MockQuery(results, this.modelName, true);
  }

  async create(data) {
    const doc = new MockDocument(this.modelName, data);
    await doc.save();
    return doc;
  }

  async insertMany(records) {
    const inserted = [];
    for (const record of records) {
      const doc = await this.create(record);
      inserted.push(doc);
    }
    return inserted;
  }

  async deleteMany() {
    store[this.modelName] = [];
    return { deletedCount: 0 };
  }

  async countDocuments() {
    return store[this.modelName].length;
  }
}

// Singletons for mock models
const mockModels = {
  User: new MockModel('User'),
  Asset: new MockModel('Asset'),
  Risk: new MockModel('Risk')
};

const getMockModel = (modelName) => {
  return mockModels[modelName];
};

module.exports = { getMockModel, store };
