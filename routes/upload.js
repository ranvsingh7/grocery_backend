const express = require('express');
const multer = require('multer');
const { uploadImage } = require('../utils/gcloudStorage');
const {authMiddleware} = require('../middleware/auth'); // Ensure you have the auth middleware if needed

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();
router.use(authMiddleware); // Apply authentication middleware if needed

router.post('/upload-image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const publicUrl = await uploadImage(req.file);
    res.status(200).json({ url: publicUrl });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

module.exports = router;
