import { defineConfig } from "vite";

export default defineConfig(({mode}) => ({
  build: {
    minify: mode === "production",
  },
}));
