import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.closetmate.app',
  appName: 'ClosetMate',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '1044175339595-gptets0htodu6uq5u568p1l2v5gjnoks.apps.googleusercontent.com',
      forceCodeForRefreshToken: false,
    },
  },
};

export default config;
