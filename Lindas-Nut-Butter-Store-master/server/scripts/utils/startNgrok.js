const ngrok = require('ngrok');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const chalk = require('chalk');
require('dotenv').config();

const envPath = path.resolve(__dirname, '../.env');

async function start() {
  console.log(chalk.yellow('🚀 Starting development server with Ngrok...'));

  if (!process.env.NGROK_AUTHTOKEN) {
    console.error(chalk.red('❌ CRITICAL: NGROK_AUTHTOKEN is not defined in your .env file.'));
    console.log(chalk.blue('Please get your token from https://dashboard.ngrok.com/get-started/your-authtoken and add it to your .env file.'));
    process.exit(1);
  }

  // 1. Start Ngrok tunnel
  const url = await ngrok.connect({
    proto: 'http',
    addr: process.env.PORT || 5000,
    authtoken: process.env.NGROK_AUTHTOKEN,
  });
  console.log(chalk.green(`✅ Ngrok tunnel established at: ${url}`));

  // 2. Update .env file with the public URL
  try {
    let envFileContent = fs.readFileSync(envPath, 'utf8');
    const urlRegex = /^PUBLIC_URL=.*$/m;
    const newPublicUrlLine = `PUBLIC_URL=${url}`;

    if (urlRegex.test(envFileContent)) {
      envFileContent = envFileContent.replace(urlRegex, newPublicUrlLine);
    } else {
      envFileContent += `\n${newPublicUrlLine}`;
    }
    fs.writeFileSync(envPath, envFileContent);
    console.log(chalk.green('✅ Updated PUBLIC_URL in .env file. The server will now use this for callbacks.'));
  } catch (error) {
    console.error(chalk.red(`❌ Error updating .env file: ${error.message}`));
    console.log(chalk.blue('Please ensure your .env file exists in the root directory.'));
    process.exit(1);
  }

  // 3. Start backend and frontend servers concurrently
  console.log(chalk.yellow('🔄 Starting backend and frontend servers...'));
  const concurrently = spawn('npm', ['run', 'start'], {
    stdio: 'inherit',
    shell: true,
  });

  concurrently.on('close', (code) => {
    console.log(`Server processes exited with code ${code}`);
    ngrok.disconnect();
    process.exit();
  });

  process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n🛑 Shutting down servers and Ngrok tunnel...'));
    await ngrok.disconnect(url);
    console.log(chalk.green('✅ Ngrok tunnel disconnected.'));
    concurrently.kill();
    process.exit(0);
  });
}

start().catch((error) => {
  console.error(chalk.red('❌ Failed to start development server:'), error);
  ngrok.disconnect();
  process.exit(1);
});

