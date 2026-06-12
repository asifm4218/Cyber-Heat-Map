const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all assets
// @route   GET /api/assets
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const assets = await Asset.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: assets.length,
      data: assets,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a new asset
// @route   POST /api/assets
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, type, department, ipAddress, owner, status } = req.body;

    // Check if asset already exists by name
    const assetExists = await Asset.findOne({ name });
    if (assetExists) {
      return res.status(400).json({ success: false, message: 'Asset with this name already exists' });
    }

    const asset = await Asset.create({
      name,
      type,
      department,
      ipAddress,
      owner,
      status,
    });

    res.status(201).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete an asset
// @route   DELETE /api/assets/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    await asset.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Asset removed successfully',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
