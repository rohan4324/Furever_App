import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Function to create SVG placeholder
const createSVGPlaceholder = (text, width = 400, height = 400) => {
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#CCCCCC"/>
  <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#333333" text-anchor="middle" dominant-baseline="middle">
    ${text}
  </text>
</svg>`;
};

// Setup directory and create images
const setupDirectory = async () => {
  const productsDir = path.join(process.cwd(), "public/images/products");
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(productsDir)) {
    fs.mkdirSync(productsDir, { recursive: true });
    console.log('Created directory:', productsDir);
  } else {
    // Clean up existing images
    const files = fs.readdirSync(productsDir);
    for (const file of files) {
      fs.unlinkSync(path.join(productsDir, file));
      console.log('Removed existing image:', file);
    }
  }

  // List of required product images from migrations
  const productImages = [
    { name: 'royal-canin-premium.jpg', displayName: 'Royal Canin Premium' },
    { name: 'hills-science-diet.jpg', displayName: 'Hills Science Diet' },
    { name: 'luxury-pet-bed.jpg', displayName: 'Luxury Pet Bed' },
    { name: 'grooming-kit.jpg', displayName: 'Grooming Kit' },
    { name: 'training-leash.jpg', displayName: 'Training Leash' },
    { name: 'safety-harness.jpg', displayName: 'Safety Harness' },
    { name: 'placeholder.jpg', displayName: 'Product Image' }
  ];

  // Create SVG placeholders for each product
  for (const { name, displayName } of productImages) {
    const svgContent = createSVGPlaceholder(displayName);
    const svgPath = path.join(productsDir, name.replace('.jpg', '.svg'));
    
    try {
      // Write SVG file
      fs.writeFileSync(svgPath, svgContent);
      console.log('Created SVG placeholder:', svgPath);
      
      // For now, we'll use the SVG as both SVG and JPG (we'll rename it)
      fs.copyFileSync(svgPath, path.join(productsDir, name));
      console.log('Created image:', name);
    } catch (error) {
      console.error(`Failed to create ${name}:`, error);
      process.exit(1);
    }
  }

  // Set directory permissions
  fs.chmodSync(productsDir, 0o755);
  console.log('Set directory permissions to 755');
};

// Run the setup
setupDirectory().catch(console.error);