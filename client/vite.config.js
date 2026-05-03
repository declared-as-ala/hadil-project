process.env.COMSPEC = 'C:\\WINDOWS\\system32\\cmd.exe';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: 'localhost',
    strictPort: false,
    fs: {
      strict: false,
    },
  },
  build: {
    sourcemap: false,
    minify: false,
  },
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
});

