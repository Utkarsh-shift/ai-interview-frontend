import fs from "fs";
import path from "path";

const logsFilePath = path.join(process.cwd(), "logs.json");

export function saveLog(logData: any) {
  let logs: any[] = [];

  if (fs.existsSync(logsFilePath)) {
    logs = JSON.parse(fs.readFileSync(logsFilePath, "utf-8"));
  }

  logs.push({ timestamp: new Date().toISOString(), ...logData });

  fs.writeFileSync(logsFilePath, JSON.stringify(logs, null, 2));
}
