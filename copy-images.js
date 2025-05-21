const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, 'public', 'images');

// Define mappings for missing images to existing ones
const imageMappings = [
  // Format: [targetImageName, sourceImageName]
  ['crunchy-almond-butter.jpg', 'plain-almond.jpg'],
  ['spicy-cashew.jpg', 'chilli-choco-cashew.jpg'],
  ['coconut-cashew.jpg', 'coconut-cashew-butter.jpg'],
  ['chocolate-hazelnut.jpg', 'chocolate-hazelnut-butter.jpg'],
  ['chocolate-mint-peanut.jpg', 'mint-chocolate-peanut.jpg']
];

console.log('Starting image copy process...');

// Make sure all images exist by copying from source to destination
let copyCount = 0;
imageMappings.forEach(([target, source]) => {
  const sourcePath = path.join(imagesDir, source);
  const targetPath = path.join(imagesDir, target);
  
  // Check if source exists and target doesn't
  if (fs.existsSync(sourcePath) && !fs.existsSync(targetPath)) {
    try {
      // Copy the file
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✓ Copied ${source} → ${target}`);
      copyCount++;
    } catch (err) {
      console.error(`❌ Error copying ${source} to ${target}:`, err);
    }
  } else if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Source image not found: ${source}`);
  } else {
    console.log(`ℹ️ Target image already exists: ${target}`);
  }
});

console.log(`\nComplete! Copied ${copyCount} image(s).`);
