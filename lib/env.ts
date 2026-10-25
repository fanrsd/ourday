// Next loads .env itself; scripts and tests do not, so they call this.
// process.loadEnvFile is built into Node 21+ — no dotenv dependency.
let done = false;
export function loadEnv() {
  if (done) return;
  done = true;
  try {
    process.loadEnvFile();
  } catch {
    // no .env file: environment is already provided
  }
}
