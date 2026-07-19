import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cyber.ai.app',
  appName: 'Cyber AI',
  webDir: 'dist',
  server: {
    hostname: 'cyber-ai-gacor.vercel.app',
    androidScheme: 'https'
  }
};

export default config;
