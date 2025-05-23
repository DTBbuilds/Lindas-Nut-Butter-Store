/**
 * Deployment Script for Linda's Nut Butter Store
 * 
 * This script prepares the application for production deployment by:
 * 1. Building the React frontend
 * 2. Copying necessary files to the dist directory
 * 3. Creating a production-ready structure
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

// Configuration
const config = {
  buildDir: path.join(__dirname, 'build'),
  serverDir: path.join(__dirname, 'server'),
  distDir: path.join(__dirname, 'dist'),
  publicDir: path.join(__dirname, 'public'),
  packageJson: path.join(__dirname, 'package.json')
};

// Ensure chalk is installed
try {
  require.resolve('chalk');
} catch (e) {
  console.log('Installing required dependencies...');
  execSync('npm install chalk fs-extra --save-dev', { stdio: 'inherit' });
}

// Helper to log with colors
const log = {
  info: (msg) => console.log(chalk.blue('INFO: ') + msg),
  success: (msg) => console.log(chalk.green('SUCCESS: ') + msg),
  error: (msg) => console.log(chalk.red('ERROR: ') + msg),
  warning: (msg) => console.log(chalk.yellow('WARNING: ') + msg)
};

// Clean previous builds
function cleanDist() {
  log.info('Cleaning dist directory...');
  fs.removeSync(config.distDir);
  fs.ensureDirSync(config.distDir);
  fs.ensureDirSync(path.join(config.distDir, 'public'));
  log.success('Dist directory cleaned');
}

// Build React frontend
function buildFrontend() {
  log.info('Building React frontend...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    log.success('Frontend built successfully');
  } catch (error) {
    log.error('Failed to build frontend');
    throw error;
  }
}

// Copy server files
function copyServerFiles() {
  log.info('Copying server files...');
  fs.copySync(config.serverDir, path.join(config.distDir, 'server'), {
    filter: (src) => {
      // Skip node_modules and any test files
      return !src.includes('node_modules') && !src.includes('.test.js');
    }
  });
  log.success('Server files copied');
}

// Copy frontend build
function copyFrontendBuild() {
  log.info('Copying frontend build...');
  fs.copySync(config.buildDir, path.join(config.distDir, 'public'));
  log.success('Frontend build copied');
}

// Create production package.json
function createProductionPackageJson() {
  log.info('Creating production package.json...');
  const pkg = require(config.packageJson);
  
  // Create a simplified package.json for production
  const prodPkg = {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
    main: 'server/index.js',
    scripts: {
      start: 'NODE_ENV=production node server/index.js'
    },
    dependencies: pkg.dependencies,
    engines: {
      node: '>=14.0.0'
    }
  };
  
  // Remove development dependencies
  delete prodPkg.dependencies['react-scripts'];
  delete prodPkg.dependencies['nodemon'];
  
  fs.writeFileSync(
    path.join(config.distDir, 'package.json'),
    JSON.stringify(prodPkg, null, 2)
  );
  
  // Copy .env.production to dist as .env
  if (fs.existsSync(path.join(__dirname, '.env.production'))) {
    fs.copySync(
      path.join(__dirname, '.env.production'),
      path.join(config.distDir, '.env')
    );
  } else {
    log.warning('.env.production not found. Make sure to create it before deployment.');
  }
  
  log.success('Production package.json created');
}

// Create deployment README
function createDeploymentReadme() {
  log.info('Creating deployment README...');
  
  const readmeContent = `# Linda's Nut Butter Store - Production Deployment

This directory contains the production-ready build of Linda's Nut Butter Store.

## Deployment Instructions

1. Upload the contents of this directory to your server
2. Install dependencies: \`npm install --production\`
3. Make sure to configure your environment variables in the \`.env\` file
4. Start the application: \`npm start\`

## Important Notes

- The server will run on the port specified in the \`.env\` file (default: 5000)
- Make sure to set up MongoDB Atlas and update the connection string
- Update all M-Pesa credentials with your production values
- Configure your domain and SSL certificate

## Support

For any issues, please contact the development team.
`;

  fs.writeFileSync(
    path.join(config.distDir, 'README.md'),
    readmeContent
  );
  
  log.success('Deployment README created');
}

// Main function
async function main() {
  try {
    log.info('Starting deployment build process...');
    
    // Run all steps
    cleanDist();
    buildFrontend();
    copyServerFiles();
    copyFrontendBuild();
    createProductionPackageJson();
    createDeploymentReadme();
    
    log.success('Deployment build completed successfully!');
    log.info(`The production-ready application is available in the '${path.relative(__dirname, config.distDir)}' directory.`);
    log.info('Follow the instructions in the README.md file to deploy to your server.');
  } catch (error) {
    log.error(`Deployment build failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main();
