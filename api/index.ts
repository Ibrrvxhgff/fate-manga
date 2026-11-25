// The production build creates this bundled ESM entrypoint before Vercel packages the function.
// @ts-expect-error The generated bundle has no standalone declaration file.
import { createApp } from "../dist/index.js";

const appPromise = createApp();

export default async function handler(req: any, res: any) {
  const { app } = await appPromise;
  return app(req, res);
}
