import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,
    proxy: {
      "/api": {
        target: "https://www.reviverimagem.shop/",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
  build: {
    rollupOptions: {
      external: [
        "fs",
        "path",
        "crypto",
        "os",
        "http",
        "net",
        "events",
        "stream",
        "url",
        "querystring",
        "zlib", // Adicionei o zlib para evitar erros
        "util",
        "tls",
        "assert",
        "buffer",
        "async_hooks",
        "https",
      ],
    },
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      "tls": false,
      "assert": false,
      "buffer": false,
      "async_hooks": false,
      "https": false,
      "zlib": false,
      "util": false,
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
    global: {}, // Evita erro de dependência do Node.js
  },
});
