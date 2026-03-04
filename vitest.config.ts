import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		environment: "jsdom",
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts"],
			exclude: [
				"src/**/*.test.ts",
				"src/**/*.d.ts",
				"src/types.ts",
				"src/ui.ts",
				"src/**/*.tsx",
				"src/triage/mount.ts",
			],
			thresholds: {
				statements: 80,
				branches: 80,
				functions: 80,
				lines: 80,
			},
		},
	},
});
