/**
 * Logger utility for structured application logging.
 */

/**
 * Logs an M-Pesa related event or error with structured details.
 * @param {string} eventName - A descriptive name for the event (e.g., 'StkPushSuccess', 'CallbackProcessingError').
 * @param {object} details - An object containing relevant details about the event.
 * @param {'INFO' | 'ERROR' | 'WARN' | 'DEBUG'} level - Log level (defaults to 'INFO' for non-errors, 'ERROR' if eventName contains 'Error' or 'Fail').
 */
const logMpesaEvent = (eventName, details, level) => {
  let logLevel = level;
  if (!logLevel) {
    if (eventName.toLowerCase().includes('error') || eventName.toLowerCase().includes('fail')) {
      logLevel = 'ERROR';
    } else {
      logLevel = 'INFO';
    }
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    level: logLevel,
    service: 'MpesaService',
    event: eventName,
    details: details
  };

  // Output as JSON string for potential parsing by log management systems
  // Or use a more sophisticated logger library like Winston or Pino in a real app
  if (logLevel === 'ERROR') {
    console.error(JSON.stringify(logEntry, null, 2));
  } else if (logLevel === 'WARN') {
    console.warn(JSON.stringify(logEntry, null, 2));
  } else {
    console.log(JSON.stringify(logEntry, null, 2));
  }
};

module.exports = {
  logMpesaEvent
};
