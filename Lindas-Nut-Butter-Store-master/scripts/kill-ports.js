// scripts/kill-ports.js

const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

const portsToKill = [3000, 5000];

async function findAndKillProcess(port) {
  try {
    const { stdout } = await execPromise(`netstat -ano | findstr :${port}`);
    const lines = stdout.trim().split('\n');
    const pids = new Set();

    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 4 && parts[1].endsWith(`:${port}`)) {
        const pid = parts[parts.length - 1];
        if (pid !== '0') {
          pids.add(pid);
        }
      }
    });

    if (pids.size > 0) {
      console.log(`Processes found on port ${port}: ${[...pids].join(', ')}`);
      for (const pid of pids) {
        try {
          await execPromise(`taskkill /F /PID ${pid}`);
          console.log(`Successfully terminated process ${pid} on port ${port}.`);
        } catch (killError) {
          // Ignore errors if the process is already gone
          if (!killError.message.includes('not found')) {
            console.error(`Failed to kill process ${pid}:`, killError);
          }
        }
      }
    } else {
      console.log(`No active processes found on port ${port}.`);
    }
  } catch (error) {
    // This command will error if no process is found, which is fine.
    if (error.stderr && !error.stderr.includes('No matching tasks')) {
        console.log(`No processes found listening on port ${port}.`);
    } else if (!error.stderr) {
        console.log(`No active processes found on port ${port}.`);
    }
  }
}

async function killPorts() {
  console.log('Clearing specified ports before server startup...');
  for (const port of portsToKill) {
    await findAndKillProcess(port);
  }
  console.log('Port clearing complete.');
}

killPorts();
