const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Directories
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(__dirname, 'output');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e4);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

app.use(express.static('public'));
app.use(express.json());

// Supported conversion targets
const SUPPORTED_FORMATS = ['png', 'jpg', 'webp', 'avif', 'tiff'];

// Estimate conversion speed in megapixels per second
const CONVERSION_SPEED_MPPS = {
  png: 25,
  jpg: 40,
  webp: 15,
  avif: 3,
  tiff: 50
};

/**
 * POST /api/upload
 * Upload a single file, return metadata and conversion estimates.
 */
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const filePath = req.file.path;
    const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
    const ext = path.extname(originalName).replace('.', '').toLowerCase();
    const baseName = path.basename(originalName, path.extname(originalName));
    const stats = fs.statSync(filePath);
    const fileSizeBytes = stats.size;

    let metadata = {};
    let megapixels = 1;
    try {
      const meta = await sharp(filePath).metadata();
      metadata = {
        width: meta.width,
        height: meta.height,
        format: meta.format,
        channels: meta.channels,
        hasAlpha: meta.hasAlpha
      };
      megapixels = (meta.width * meta.height) / 1e6;
    } catch {
      // Non-image file or unreadable — still allow upload info display
      metadata = { format: ext, width: null, height: null };
    }

    // Build conversion estimates using source-size-relative ratios.
    // These ratios approximate the typical output/input size when the source is a
    // common photographic/web image. For tiny images the estimates will be rough.
    const SOURCE_RELATIVE_RATIOS = {
      png: 1.2,   // lossless — often larger than lossy source
      jpg: 0.85,
      webp: 0.55,
      avif: 0.40,
      tiff: 3.0    // uncompressed by default
    };

    const estimates = SUPPORTED_FORMATS.map(fmt => {
      const ratio = SOURCE_RELATIVE_RATIOS[fmt] || 1.0;
      const estimatedSize = Math.round(fileSizeBytes * ratio);
      const speed = CONVERSION_SPEED_MPPS[fmt] || 10;
      const estimatedTimeMs = Math.round((megapixels / speed) * 1000);
      const reduction = fileSizeBytes > 0
        ? Math.round((1 - estimatedSize / fileSizeBytes) * 100)
        : 0;

      return {
        format: fmt,
        estimatedSizeBytes: estimatedSize,
        estimatedTimeMs,
        reductionPercent: reduction,
        isSameFormat: fmt === (metadata.format || ext)
      };
    });

    return res.json({
      id: path.basename(filePath, path.extname(filePath)),
      storedFilename: req.file.filename,
      originalName,
      baseName,
      extension: ext,
      sizeBytes: fileSizeBytes,
      metadata,
      estimates
    });
  } catch (err) {
    console.error('Upload analysis error:', err);
    return res.status(500).json({ error: 'Failed to analyze file' });
  }
});

/**
 * POST /api/convert
 * Convert an uploaded file to selected formats with optional prefix/postfix.
 * Body: { storedFilename, formats: ['png','webp'], prefix: '', postfix: '_converted' }
 */
app.post('/api/convert', async (req, res) => {
  try {
    const { storedFilename, baseName, formats, prefix, postfix } = req.body;
    if (!storedFilename || !formats || !formats.length) {
      return res.status(400).json({ error: 'storedFilename and formats[] required' });
    }

    const inputPath = path.join(UPLOAD_DIR, storedFilename);
    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({ error: 'Source file not found' });
    }

    const pfx = prefix || '';
    const sfx = postfix || '';
    const base = baseName || path.basename(storedFilename, path.extname(storedFilename));
    const results = [];

    for (const fmt of formats) {
      if (!SUPPORTED_FORMATS.includes(fmt)) {
        results.push({ format: fmt, success: false, error: 'Unsupported format' });
        continue;
      }

      const outputName = `${pfx}${base}${sfx}.${fmt}`;
      const outputPath = path.join(OUTPUT_DIR, outputName);
      const startTime = Date.now();

      try {
        let pipeline = sharp(inputPath);
        switch (fmt) {
          case 'png':  pipeline = pipeline.png({ quality: 80 }); break;
          case 'jpg':  pipeline = pipeline.jpeg({ quality: 80 }); break;
          case 'webp': pipeline = pipeline.webp({ quality: 80 }); break;
          case 'avif': pipeline = pipeline.avif({ quality: 50 }); break;
          case 'tiff': pipeline = pipeline.tiff({ quality: 80 }); break;
        }
        await pipeline.toFile(outputPath);

        const outStats = fs.statSync(outputPath);
        results.push({
          format: fmt,
          success: true,
          outputName,
          sizeBytes: outStats.size,
          elapsedMs: Date.now() - startTime
        });
      } catch (convErr) {
        results.push({ format: fmt, success: false, error: convErr.message });
      }
    }

    return res.json({ results });
  } catch (err) {
    console.error('Conversion error:', err);
    return res.status(500).json({ error: 'Conversion failed' });
  }
});

/**
 * GET /api/download/:filename
 * Download a converted file from the output directory.
 */
app.get('/api/download/:filename', (req, res) => {
  const filePath = path.join(OUTPUT_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  res.download(filePath);
});

app.listen(PORT, () => {
  console.log(`Media Toolkit running at http://localhost:${PORT}`);
});
