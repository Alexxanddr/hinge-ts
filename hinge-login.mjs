import { readFile, writeFile, access, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  BrowserFetchTransport,
  Email2FAError,
  HingeClient
} from "./dist/index.js";

const sessionFile =
  process.env.HINGE_SESSION_FILE ||
  `${process.env.HOME}/hinge-mcp-data/session.json`;

class FileStorage {
  async exists(path) {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  readText(path) {
    return readFile(path, "utf8");
  }

  async writeText(path, value) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, value, { mode: 0o600 });
  }
}

const phone = process.env.HINGE_PHONE_NUMBER;
if (!phone) throw new Error("Imposta HINGE_PHONE_NUMBER in formato E.164");

const rl = createInterface({ input, output });
const client = HingeClient.builder()
  .phoneNumber(phone)
  .transport(new BrowserFetchTransport())
  .storage(new FileStorage())
  .build();

await client.auth.initiateSms();
console.log("SMS richiesto.");

const otp = await rl.question("OTP ricevuto: ");

try {
  await client.auth.submitOtp(otp);
} catch (error) {
  if (!(error instanceof Email2FAError)) throw error;

  const emailCode = await rl.question("Codice ricevuto via email: ");
  await client.auth.submitEmailCode(error.caseId, emailCode);
}

await client.persistence.saveSession(sessionFile);
await rl.close();

console.log(`Sessione salvata in ${sessionFile}`);
