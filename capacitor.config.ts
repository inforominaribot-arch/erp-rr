import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rominaribot.mediciones',
  appName: 'RR Mediciones',
  webDir: 'mobile-dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    // Redirige todos los fetch() por HTTP nativo de Android (OkHttp)
    // Esto evita las restricciones CORS del WebView completamente
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;

