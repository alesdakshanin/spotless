import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
	base: "./",
	plugins: [tailwindcss()],
	server: {
		host: "127.0.0.1",
	},
});
