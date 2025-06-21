// scripts/stop-dev.js
const { exec } = require('child_process');
const util = require('util');
const path = require('path');

const execPromise = util.promisify(exec);

// Kills processes by name, essential for cleaning up orphaned ngrok processes.
const killProcessByName = (name) => {
  return new Promise((resolve) => {
    const command = process.platform === 'win32' 
      ? `taskkill /F /T /IM ${name}` 
      : `pkill -f ${name}`;
      
    exec(command, (err, stdout, stderr) => {
      if (err && !stderr.includes('not found')) {
        console.warn(`Warning when trying to kill ${name}:`, stderr.trim());
      } else {
        console.log(`Termination command for '${name}' executed.`);
      }
      resolve();
    });
  });
};

const stop = async () => {
  console.log('--- Forcefully stopping all development services ---');
  
  // Phase 1: Kill stubborn ngrok process by name.
  await killProcessByName('ngrok.exe');

  // Phase 2: Kill any processes on our specific ports.
  // This is the safest way to stop the node servers without killing the script runner itself.
  try {
    const killScriptPath = path.join(__dirname, 'kill-ports.js');
    const { stdout, stderr } = await execPromise(`node "${killScriptPath}"`);
    if (stdout) console.log(stdout.trim());
    if (stderr) console.error(stderr.trim());
  } catch (error) {
      console.error('Error occurred while clearing ports:', error);
  }

  console.log('--- Shutdown complete ---');
};

if (require.main === module) {
  stop();
}

module.exports = stop;
