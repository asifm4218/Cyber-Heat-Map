const express = require('express');
const router = express.Router();
const { Readable } = require('stream');
const csv = require('csv-parser');
const Risk = require('../models/Risk');
const Asset = require('../models/Asset');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Helper to normalize keys from CSV
const normalizeRow = (row) => {
  const normalized = {};
  for (const key in row) {
    if (row.hasOwnProperty(key)) {
      const cleanKey = key.trim().toLowerCase().replace(/[\s_]+/g, '');
      normalized[cleanKey] = row[key] ? row[key].trim() : '';
    }
  }
  return normalized;
};

// @desc    Get all risks
// @route   GET /api/risks
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const risks = await Risk.find({})
      .populate('reportedBy', 'username email role')
      .sort({ dateReported: -1 });

    res.status(200).json({
      success: true,
      count: risks.length,
      data: risks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a new risk log
// @route   POST /api/risks
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      assetName,
      assetType,
      department,
      threatCategory,
      vulnerability,
      likelihood,
      impact,
    } = req.body;

    // Optional: verify that the asset actually exists in the database
    // For local flexibility, we can just allow it or auto-create it if missing.
    let asset = await Asset.findOne({ name: assetName });
    if (!asset) {
      // If asset is not in inventory, auto-create a basic one or let it pass
      asset = await Asset.create({
        name: assetName,
        type: assetType || 'Other',
        department: department || 'General',
        ipAddress: 'N/A',
        owner: 'Unassigned',
        status: 'Active',
      });
    }

    const risk = await Risk.create({
      assetName,
      assetType: asset.type,
      department: asset.department,
      threatCategory,
      vulnerability,
      likelihood: Number(likelihood),
      impact: Number(impact),
      reportedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: risk,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Upload CSV containing risk logs
// @route   POST /api/risks/upload
// @access  Private
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a CSV file' });
  }

  const results = [];
  const errors = [];
  const riskRecords = [];

  try {
    // Read from buffer
    const stream = Readable.from(req.file.buffer.toString('utf-8'));

    stream
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', async () => {
        if (results.length === 0) {
          return res.status(400).json({ success: false, message: 'CSV file is empty' });
        }

        for (let i = 0; i < results.length; i++) {
          const row = results[i];
          const norm = normalizeRow(row);

          // Get fields with fallback keys
          const assetName = norm.assetname || norm.asset || norm.name;
          const assetType = norm.assettype || norm.type || 'Other';
          const department = norm.department || norm.dept || 'General';
          const threatCategory = norm.threatcategory || norm.threat || 'Uncategorized';
          const vulnerability = norm.vulnerability || norm.vuln || 'Unknown';
          const likelihood = parseInt(norm.likelihood);
          const impact = parseInt(norm.impact);

          // Validation
          if (!assetName) {
            errors.push(`Row ${i + 1}: Asset Name is required`);
            continue;
          }
          if (isNaN(likelihood) || likelihood < 1 || likelihood > 5) {
            errors.push(`Row ${i + 1} (${assetName}): Likelihood must be a number between 1 and 5`);
            continue;
          }
          if (isNaN(impact) || impact < 1 || impact > 5) {
            errors.push(`Row ${i + 1} (${assetName}): Impact must be a number between 1 and 5`);
            continue;
          }

          // Make sure asset exists or create it
          let asset = await Asset.findOne({ name: assetName });
          if (!asset) {
            asset = await Asset.create({
              name: assetName,
              type: assetType,
              department: department,
              ipAddress: 'N/A',
              owner: 'Unassigned',
              status: 'Active',
            });
          }

          riskRecords.push({
            assetName,
            assetType: asset.type,
            department: asset.department,
            threatCategory,
            vulnerability,
            likelihood,
            impact,
            reportedBy: req.user._id,
            status: 'Pending',
          });
        }

        if (riskRecords.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'No valid records found in CSV',
            errors,
          });
        }

        // Insert to Database
        const insertedRisks = await Risk.insertMany(riskRecords);

        res.status(201).json({
          success: true,
          count: insertedRisks.length,
          errors: errors.length > 0 ? errors : null,
          data: insertedRisks,
        });
      })
      .on('error', (err) => {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error parsing CSV file' });
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update risk status (Approve or Mitigate)
// @route   PATCH /api/risks/:id/status
// @access  Private/Admin
router.patch('/:id/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Pending', 'Approved', 'Mitigated'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const risk = await Risk.findById(req.params.id);

    if (!risk) {
      return res.status(404).json({ success: false, message: 'Risk log not found' });
    }

    risk.status = status;
    await risk.save();

    res.status(200).json({
      success: true,
      data: risk,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
