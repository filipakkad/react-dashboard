import { AliasOptions, defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from "vite-tsconfig-paths";
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config()

const getAlias = (items: string[]) =>
    items.map<AliasOptions>((item) => ({
        find: item,
        replacement: resolve(__dirname, "src", item),
    }));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), viteTsconfigPaths()],
  // base: process.env.VITE_APP_ROOT_BASE_URL,
  resolve: {
    alias: [
      ...getAlias(["queries"]),
    ],
  },
})
