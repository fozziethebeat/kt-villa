import { defineConfig } from '@playwright/test';

export default defineConfig({
  // Software-rendered WebGL is CPU-heavy; parallel games starve each other's frame rate.
  workers: 1,
  testDir: 'tests/e2e',
  timeout: 60_000,
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: 'disabled' } },
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1280, height: 720 },
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] },
  },
  webServer: { command: 'npm run dev', port: 5173, reuseExistingServer: true },
});
