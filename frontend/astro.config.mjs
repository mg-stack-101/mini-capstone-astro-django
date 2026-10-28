import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  devToolbar: { enabled: false },

  integrations: [react()],

  server: {
    port: 4321,
  },

  vite: {
    plugins: [tailwindcss()],

    server: {
      strictPort: true,

      proxy: {
        "/api": {
          target: "http://127.0.0.1:8000",
          changeOrigin: false,
        },
      },
    },
  },
});