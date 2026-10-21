import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioButton } from "../components/ui/AudioButton.js";

// Minimal speech + media stubs so toggling into the "playing" state works under jsdom. Playback is
// started synchronously inside the click (setPlaying(true)), so no awaiting is needed to assert the
// icon swap.
beforeEach(() => {
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      text: string;
      constructor(text: string) {
        this.text = text;
      }
    },
  );
  vi.stubGlobal("speechSynthesis", {
    cancel: vi.fn(),
    getVoices: () => [{ lang: "vi-VN", name: "Vietnamese" }],
    speak: (utterance: { onstart?: (e: Event) => void }) => {
      utterance.onstart?.(new Event("start"));
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("AudioButton playing indicator (Log Bug v2, Bug 2)", () => {
  it("swaps the square stop glyph for an animated sound-wave while playing", () => {
    const { container } = render(
      <AudioButton audioUrl="/word.mp3" textToSpeak="Xin chao" />,
    );
    const button = screen.getByRole("button");
    // Idle: a plain speaker, no "playing" sound-wave indicator yet.
    expect(screen.queryByTestId("audio-playing-wave")).not.toBeInTheDocument();

    fireEvent.click(button);

    // Playing: the wave indicator shows, the square glyph is gone, and the toggle reads as pressed.
    expect(screen.getByTestId("audio-playing-wave")).toBeInTheDocument();
    expect(container.querySelector(".lucide-square")).toBeNull();
    expect(button).toHaveAttribute("aria-pressed", "true");
  });

  it("renders at least two sound-wave bars that fall still under reduced motion", () => {
    render(<AudioButton audioUrl="/word.mp3" textToSpeak="Xin chao" />);
    fireEvent.click(screen.getByRole("button"));

    const wave = screen.getByTestId("audio-playing-wave");
    const bars = wave.querySelectorAll("span.animate-soundwave");
    expect(bars.length).toBeGreaterThanOrEqual(2);
    // Each bar suppresses its pulse for prefers-reduced-motion but keeps a resting height.
    bars.forEach((bar) =>
      expect(bar.className).toContain("motion-reduce:animate-none"),
    );
  });

  it("returns to the idle speaker on a second click", () => {
    render(<AudioButton audioUrl="/word.mp3" textToSpeak="Xin chao" />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);

    expect(screen.queryByTestId("audio-playing-wave")).not.toBeInTheDocument();
    expect(button).toHaveAttribute("aria-pressed", "false");
  });
});
