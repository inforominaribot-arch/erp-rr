import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rominaribot.mediciones',
  appName: 'RR Mediciones',
  webDir: 'mobile-dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
};

export default config;
