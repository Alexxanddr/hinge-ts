import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

import {
  BrowserFetchTransport,
  Email2FAError,
  HingeClient,
} from "./dist/index.js";

const phoneNumber = process.env.HINGE_PHONE_NUMBER;

if (!phoneNumber) {
  throw new Error("Imposta HINGE_PHONE_NUMBER, per esempio +393331234567");
}

const input = createInterface({ input: stdin, output: stdout });

const client = HingeClient.builder()
  .phoneNumber(phoneNumber)
  .transport(new BrowserFetchTransport())
  .build();

try {
  console.log("Invio SMS...");
  await client.auth.initiateSms();

  const otp = await input.question("Codice SMS: ");

  try {
    await client.auth.submitOtp(otp.trim());
  } catch (error) {
    if (!(error instanceof Email2FAError)) {
      throw error;
    }

    console.log(`È richiesta anche la verifica email: ${error.email ?? ""}`);
    const emailCode = await input.question("Codice email: ");
    await client.auth.submitEmailCode(error.caseId, emailCode.trim());
  }

  console.log("Login riuscito.");

  // Chiamata innocua in sola lettura
  const profile = await client.profiles.me();

  console.dir(profile, {
    depth: 4,
    colors: true,
  });
} finally {
  input.close();
}
