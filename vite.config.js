import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["ico.png"], // The icon in your public folder
      manifest: {
        name: "BookBot Business",
        short_name: "BookBot",
        description: "Appointment scheduling app for businesses",
        theme_color: "#0f172a", // Matches your dark button color
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "ico.png", // We will use your current icon
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "ico.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000, // Matches your Landing Page links
  },
});
