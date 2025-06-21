const { spawn } = require('child_process');
const stop = require('./stop-dev');

const path = require('path');
const ngrok = require('ngrok');
const fs = require('fs').promises;
const dotenv = require('dotenv');
dotenv.config();

let childProcesses = [];



const startService = (name, command, args, options = {}) => {
  const proc = spawn(command, args, { ...options, shell: true });
  childProcesses.push(proc);

  proc.stdout.on('data', (data) => console.log(`[${name}] ${data.toString().trim()}`));
  proc.stderr.on('data', (data) => console.error(`[${name}-ERROR] ${data.toString().trim()}`));
  proc.on('close', (code) => console.log(`[${name}] exited with code ${code}`));

  return proc;
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const connectToNgrokWithRetry = async (options, retries = 5, delayMs = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const url = await ngrok.connect(options);
      return url;
    } catch (error) {
      if (error.message.includes('ECONNREFUSED')) {
        console.warn(`[ngrok] Connection refused. Retrying in ${delayMs / 1000}s... (${i + 1}/${retries})`);
        await delay(delayMs);
      } else {
        throw error;
      }
    }
  }
  throw new Error(`[ngrok] Failed to connect after ${retries} attempts.`);
};


const start = async () => {
  console.log('--- Starting Interactive Development Environment ---');
  await stop(); // Clean up any previous processes first

  try {
    const projectRoot = path.resolve(__dirname, '..');
    const envPath = path.join(projectRoot, '.env');
    let envFileContent = await fs.readFile(envPath, 'utf8');
    const envConfig = dotenv.parse(envFileContent);
    const ngrokAuthToken = envConfig.NGROK_AUTHTOKEN;

    if (!ngrokAuthToken) {
      console.error('Error: NGROK_AUTHTOKEN is not defined in your .env file.');
      process.exit(1);
    }

    console.log('Starting ngrok tunnel for port 5000...');
    const url = await connectToNgrokWithRetry({ addr: 5000, authtoken: ngrokAuthToken });
    console.log(`Ngrok tunnel established at: ${url}`);

    // Update the .env file with the new public URL
    console.log('   -> Updating .env file with new ngrok URL...');
    const urlRegex = /^PUBLIC_URL=.*$/m;
    if (urlRegex.test(envFileContent)) {
      envFileContent = envFileContent.replace(urlRegex, `PUBLIC_URL=${url}`);
    } else {
      envFileContent += `\nPUBLIC_URL=${url}`;
    }
    await fs.writeFile(envPath, envFileContent, 'utf8');
    console.log('   -> .env file has been updated successfully.');

    // Set the public URL as an environment variable for the backend process
    process.env.PUBLIC_URL = url;

    startService('backend', 'npm', ['run', 'server'], { env: { ...process.env, NODE_ENV: 'development' } });
    console.log('[1/2] Backend server process initiated.');

    startService('frontend', 'npm', ['run', 'frontend']);
    console.log('[2/2] Frontend server process initiated.');

    console.log('\n--- All services are starting up. Logs will appear below. ---');
    console.log('--- Press CTRL+C to shut down all services gracefully. ---\n');

  } catch (error) {
    console.error('\n--- FATAL: Could not start environment ---');
    console.error(error.message);
    await cleanup();
  }
};

const cleanup = async () => {
  console.log('\n--- Shutting down all services... ---');
  childProcesses.forEach(proc => proc.kill());
  await stop(); // Final cleanup using the robust stop script
  process.exit(0);
};

process.on('SIGINT', cleanup); // Handle Ctrl+C
process.on('SIGTERM', cleanup);

start();
