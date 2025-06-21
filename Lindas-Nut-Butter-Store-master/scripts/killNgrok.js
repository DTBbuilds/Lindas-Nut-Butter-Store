// scripts/killNgrok.js
const ngrok = require('ngrok');
const chalk = require('chalk');

const killNgrok = async () => {
    try {
        await ngrok.kill();
        console.log(chalk.green('ngrok tunnel stopped successfully.'));
    } catch (error) {
        // Ignore errors if no tunnel is running
        if (error.body && error.body.details && error.body.details.err.includes('is not running')) {
            console.log(chalk.yellow('No active ngrok tunnel to stop.'));
        } else {
            console.error(chalk.red('Error stopping ngrok tunnel:'), error);
        }
    }
};

killNgrok();
