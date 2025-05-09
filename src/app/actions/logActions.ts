let logs: any[] = [];

export async function saveLog(logData: any) {
  logs.push({
    timestamp: new Date().toISOString(),
    type: logData.type,
    event: logData.event,
    suffix: logData.suffix || "",
  });

  // Limit log storage to the last 50 entries
  if (logs.length > 50) {
    logs.shift();
  }
}

export function getLogs() {
  return logs; // Retrieve logs if needed for debugging
}
