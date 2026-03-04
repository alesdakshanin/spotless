import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- Module mocks (must be before any dynamic imports) ---

vi.mock("../src/api", () => ({
	get: vi.fn(),
}));

vi.mock("../src/auth", () => ({
	handleCallback: vi.fn(),
	saveTokens: vi.fn(),
	loadTokens: vi.fn(),
	clearTokens: vi.fn(),
	login: vi.fn(),
}));

vi.mock("../src/scanner", () => ({
	scan: vi.fn(),
}));

vi.mock("../src/ui", () => ({
	renderLogin: vi.fn(),
	renderScanScreen: vi.fn(),
	renderProgressScreen: vi.fn(),
	renderSourceList: vi.fn(),
	updateSourceProgress: vi.fn(),
	markSourceComplete: vi.fn(),
	renderSpotless: vi.fn(),
	renderError: vi.fn(),
}));

vi.mock("../src/triage/mount", () => ({
	mountTriageView: vi.fn(),
	unmountTriageView: vi.fn(),
}));

// --- Import mocked modules for assertions ---

import { get } from "../src/api";
import { clearTokens, handleCallback, loadTokens, saveTokens } from "../src/auth";
import { scan } from "../src/scanner";
import { mountTriageView } from "../src/triage/mount";
import {
	markSourceComplete,
	renderError,
	renderLogin,
	renderProgressScreen,
	renderScanScreen,
	renderSourceList,
	renderSpotless,
	updateSourceProgress,
} from "../src/ui";

const mockedGet = vi.mocked(get);
const mockedLoadTokens = vi.mocked(loadTokens);
const mockedHandleCallback = vi.mocked(handleCallback);
const mockedScan = vi.mocked(scan);

// --- Helpers ---

function setLocationSearch(search: string) {
	Object.defineProperty(window, "location", {
		value: { search, pathname: "/", origin: "http://localhost:3000", href: "" },
		writable: true,
		configurable: true,
	});
}

/** Create an async generator that yields the given events */
async function* fakeGenerator(events: import("../src/types").ScanEvent[]) {
	for (const event of events) {
		yield event;
	}
}

/** Create an async generator that throws on first next() call */
function throwingGenerator(error: Error): AsyncGenerator<import("../src/types").ScanEvent> {
	return {
		next: () => Promise.reject(error),
		return: (v: import("../src/types").ScanEvent) => Promise.resolve({ done: true, value: v }),
		throw: (e: unknown) => Promise.reject(e),
		[Symbol.asyncIterator]() {
			return this;
		},
	};
}

const fakeUser = { id: "u1", display_name: "Ales", images: [] };
const fakeTokens = { access_token: "at", refresh_token: "rt", expires_in: 3600 };

// --- Tests ---

describe("init()", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.resetModules();
		setLocationSearch("");
		// Stub history.replaceState to avoid errors
		vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	async function importMain() {
		await import("../src/main");
		// Let microtasks from init() settle
		await vi.waitFor(() => {
			// Check that at least one UI function was called
			const anyUiCalled =
				vi.mocked(renderLogin).mock.calls.length > 0 ||
				vi.mocked(renderScanScreen).mock.calls.length > 0 ||
				vi.mocked(renderError).mock.calls.length > 0;
			if (!anyUiCalled) throw new Error("init() not settled");
		});
	}

	it("shows login when no session", async () => {
		mockedLoadTokens.mockReturnValue(null);

		await importMain();

		expect(renderLogin).toHaveBeenCalled();
	});

	it("handles OAuth error param", async () => {
		setLocationSearch("?error=access_denied");
		mockedLoadTokens.mockReturnValue(null);

		await importMain();

		expect(renderError).toHaveBeenCalledWith(
			"Authorization denied: access_denied",
			expect.any(Function),
		);
	});

	it("handles OAuth callback success", async () => {
		setLocationSearch("?code=abc");
		mockedHandleCallback.mockResolvedValue(fakeTokens);
		mockedGet.mockResolvedValue(fakeUser);

		await importMain();

		expect(handleCallback).toHaveBeenCalledWith("abc");
		expect(saveTokens).toHaveBeenCalledWith(fakeTokens);
		expect(renderScanScreen).toHaveBeenCalled();
	});

	it("handles OAuth callback failure", async () => {
		setLocationSearch("?code=abc");
		mockedHandleCallback.mockRejectedValue(new Error("Token exchange failed"));

		await importMain();

		expect(renderError).toHaveBeenCalledWith("Token exchange failed", expect.any(Function));
	});

	it("resumes existing session", async () => {
		mockedLoadTokens.mockReturnValue({
			accessToken: "at",
			refreshToken: "rt",
			expiresAt: Date.now() + 3600000,
		});
		mockedGet.mockResolvedValue(fakeUser);

		await importMain();

		expect(renderScanScreen).toHaveBeenCalled();
	});

	it("clears invalid session", async () => {
		mockedLoadTokens.mockReturnValue({
			accessToken: "at",
			refreshToken: "rt",
			expiresAt: Date.now() + 3600000,
		});
		mockedGet.mockRejectedValue(new Error("401"));

		await importMain();

		expect(clearTokens).toHaveBeenCalled();
		expect(renderLogin).toHaveBeenCalled();
	});

	it('uses "Spotify User" when display_name is null', async () => {
		mockedLoadTokens.mockReturnValue({
			accessToken: "at",
			refreshToken: "rt",
			expiresAt: Date.now() + 3600000,
		});
		mockedGet.mockResolvedValue({ id: "u1", display_name: null, images: [] });

		await importMain();

		expect(renderScanScreen).toHaveBeenCalledWith(
			"Spotify User",
			expect.any(Function),
			expect.any(Function),
		);
	});
});

describe("startScan()", () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.resetModules();
		setLocationSearch("");
		vi.spyOn(window.history, "replaceState").mockImplementation(() => {});
		// Ensure #app exists for mount/unmount
		if (!document.querySelector("#app")) {
			const app = document.createElement("div");
			app.id = "app";
			document.body.appendChild(app);
		}
	});

	afterEach(() => {
		vi.restoreAllMocks();
		document.querySelector("#app")?.remove();
	});

	/** Import main, wait for init, then capture and return the onScan callback */
	async function getStartScan(): Promise<() => Promise<void>> {
		mockedLoadTokens.mockReturnValue({
			accessToken: "at",
			refreshToken: "rt",
			expiresAt: Date.now() + 3600000,
		});
		mockedGet.mockResolvedValue(fakeUser);

		await import("../src/main");
		await vi.waitFor(() => {
			if (vi.mocked(renderScanScreen).mock.calls.length === 0) throw new Error("not ready");
		});

		// renderScanScreen(displayName, startScan, handleLogout)
		const onScan = vi.mocked(renderScanScreen).mock.calls[0]?.[1] as () => Promise<void>;
		expect(onScan).toBeDefined();

		// Reset mocks so startScan assertions are clean
		vi.mocked(renderProgressScreen).mockClear();
		vi.mocked(renderSourceList).mockClear();
		vi.mocked(updateSourceProgress).mockClear();
		vi.mocked(markSourceComplete).mockClear();
		vi.mocked(mountTriageView).mockClear();
		vi.mocked(renderSpotless).mockClear();
		vi.mocked(renderError).mockClear();

		return onScan;
	}

	it("maps sources event to renderSourceList", async () => {
		const onScan = await getStartScan();
		mockedScan.mockReturnValue(
			fakeGenerator([
				{ type: "sources", names: ["Liked Songs", "Chill"] },
				{ type: "done", summary: { totalScanned: 0, unplayable: [] } },
			]),
		);

		await onScan();

		expect(renderSourceList).toHaveBeenCalledWith(["Liked Songs", "Chill"]);
	});

	it("maps progress events to updateSourceProgress", async () => {
		const onScan = await getStartScan();
		mockedScan.mockReturnValue(
			fakeGenerator([
				{ type: "sources", names: ["Liked Songs"] },
				{ type: "progress", source: "Liked Songs", scanned: 10, total: 50 },
				{ type: "done", summary: { totalScanned: 10, unplayable: [] } },
			]),
		);

		await onScan();

		expect(updateSourceProgress).toHaveBeenCalledWith("Liked Songs", 10, 50, 0);
	});

	it("marks previous source complete on source change", async () => {
		const onScan = await getStartScan();
		mockedScan.mockReturnValue(
			fakeGenerator([
				{ type: "sources", names: ["A", "B"] },
				{ type: "progress", source: "A", scanned: 5, total: 5 },
				{ type: "progress", source: "B", scanned: 3, total: 10 },
				{ type: "done", summary: { totalScanned: 8, unplayable: [] } },
			]),
		);

		await onScan();

		expect(markSourceComplete).toHaveBeenCalledWith("A", 5);
	});

	it("marks last source complete on done", async () => {
		const onScan = await getStartScan();
		mockedScan.mockReturnValue(
			fakeGenerator([
				{ type: "sources", names: ["A"] },
				{ type: "progress", source: "A", scanned: 5, total: 5 },
				{ type: "done", summary: { totalScanned: 5, unplayable: [] } },
			]),
		);

		await onScan();

		expect(markSourceComplete).toHaveBeenCalledWith("A", 5);
	});

	it("increments unplayable count on found events", async () => {
		const onScan = await getStartScan();
		const track = { name: "Bad", artists: ["X"], source: "Liked Songs", reason: "Unavailable" };
		mockedScan.mockReturnValue(
			fakeGenerator([
				{ type: "sources", names: ["Liked Songs"] },
				{ type: "progress", source: "Liked Songs", scanned: 1, total: 2 },
				{ type: "found", track },
				{ type: "done", summary: { totalScanned: 2, unplayable: [track] } },
			]),
		);

		await onScan();

		// After found event, updateSourceProgress should be called with count=1
		const calls = vi.mocked(updateSourceProgress).mock.calls;
		const foundCall = calls.find((c) => c[3] === 1);
		expect(foundCall).toBeDefined();
	});

	it("renders spotless for clean library", async () => {
		const onScan = await getStartScan();
		mockedScan.mockReturnValue(
			fakeGenerator([
				{ type: "sources", names: ["Liked Songs"] },
				{ type: "done", summary: { totalScanned: 10, unplayable: [] } },
			]),
		);

		await onScan();

		expect(renderSpotless).toHaveBeenCalledWith(10, expect.any(Function));
	});

	it("mounts triage view for unplayable tracks", async () => {
		const onScan = await getStartScan();
		const summary = {
			totalScanned: 10,
			unplayable: [{ name: "Bad", artists: ["X"], source: "Liked Songs", reason: "Unavailable" }],
		};
		mockedScan.mockReturnValue(
			fakeGenerator([
				{ type: "sources", names: ["Liked Songs"] },
				{ type: "done", summary },
			]),
		);

		await onScan();

		expect(mountTriageView).toHaveBeenCalledWith(
			expect.any(HTMLElement),
			summary,
			expect.any(Function),
		);
	});

	it("renders error when scan throws", async () => {
		const onScan = await getStartScan();
		mockedScan.mockReturnValue(throwingGenerator(new Error("Network failed")));

		await onScan();

		expect(renderError).toHaveBeenCalledWith("Network failed", expect.any(Function));
	});
});
