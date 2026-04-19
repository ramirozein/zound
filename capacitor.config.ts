import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ramirozein.zound',
  appName: 'Zound',
  webDir: 'public',
  server: {
    url: 'https://musica.ramirozein.me',
    cleartext: false
  }
};

export default config;
