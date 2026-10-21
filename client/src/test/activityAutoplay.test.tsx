import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioButton } from "../components/ui/AudioButton.js";
import { ListenChooseActivity } from "../features/lesson-player/activities/ListenChooseActivity.js";
import { WordCardActivity } from "../features/lesson-player/activities/WordCardActivity.js";
import { FollowStepsActivity } from "../features/lesson-player/activities/FollowStepsActivity.js";

// Opening an activity with a speaker auto-reads its primary source once (business decision,
// 21/10/2026). Playback goes through the shared one-reader narration engine, so it never overlaps,
// never loops from an asset error, and stays silent when the browser blocks it.

let spoken: SpeechSynthesisUtterance[];
let cancel: ReturnType<typeof vi.fn>;
let play: ReturnType<typeof vi.spyOn>;
let pause: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  spoken = [];
  cancel = vi.fn();
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      text: string;
      lang = "";
      voice: unknown = null;
      rate = 1;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    },
  );
  vi.stubGlobal("speechSynthesis", {
    cancel,
    getVoices: () => [
      { lang: "vi-VN", name: "Vietnamese", voiceURI: "vi", default: false, localService: true },
    ],
    speak: (utterance: SpeechSynthesisUtterance) => {
      spoken.push(utterance);
      utterance.onstart?.(new Event("start") as SpeechSynthesisEvent);
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("auto-reading the primary source on open", () => {
  it("listen_choose plays the source asset once when it exists, with no speech", () => {
    render(
      <ListenChooseActivity
        activity={{
          id: "l1",
          prompt: "Con nghe thấy ai?",
          audioUrl: "/audio/l1.mp3",
          targetWord: "Đây là mẹ.",
          correctAnswer: "a",
          options: [{ id: "a", text: "Mẹ" }],
        }}
        onComplete={() => {}}
      />,
    );
    expect(play).toHaveBeenCalledTimes(1);
    expect(spoken).toHaveLength(0);
    expect(screen.getAllByRole("button")[0]).toHaveAttribute("aria-pressed", "true");
  });

  it("listen_choose reads the clip (targetWord), not the question, when there is no asset", () => {
    render(
      <ListenChooseActivity
        activity={{
          id: "l2",
          prompt: "Con nghe thấy ai?",
          targetWord: "Đây là mẹ.",
          correctAnswer: "a",
          options: [{ id: "a", text: "Mẹ" }],
        }}
        onComplete={() => {}}
      />,
    );
    expect(play).not.toHaveBeenCalled();
    expect(spoken.map((item) => item.text)).toEqual(["Đây là mẹ."]);
  });

  it("word_card reads the target word, not the passage, and only once", () => {
    render(
      <WordCardActivity
        activity={{ id: "w1", prompt: "Đọc", subPrompt: "Một đoạn văn dài.", targetWord: "Mèo" }}
        onComplete={() => {}}
      />,
    );
    expect(play).not.toHaveBeenCalled();
    expect(spoken.map((item) => item.text)).toEqual(["Mèo"]);
  });

  it("new-activity frame reads the instructions once", () => {
    render(
      <FollowStepsActivity
        activity={{ id: "s1", type: "follow_steps", prompt: "Nghe rồi làm", steps: [{ id: "a", text: "Bước một" }] }}
        value={[]}
        onChange={() => {}}
        onSubmit={() => {}}
      />,
    );
    expect(spoken).toHaveLength(1);
    expect(spoken[0].text).toContain("Nghe rồi làm");
    expect(spoken[0].text).toContain("Bước một");
  });

  it("does nothing when the activity has nothing to read", () => {
    render(<AudioButton autoPlay contentKey="empty" label="Nghe" />);
    expect(play).not.toHaveBeenCalled();
    expect(spoken).toHaveLength(0);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});

describe("re-reading only when the activity identity changes", () => {
  it("does not replay on a rerender with the same content", () => {
    const view = render(
      <WordCardActivity activity={{ id: "same", prompt: "Đọc", targetWord: "Mèo" }} onComplete={() => {}} />,
    );
    expect(spoken.map((item) => item.text)).toEqual(["Mèo"]);
    view.rerender(
      <WordCardActivity activity={{ id: "same", prompt: "Đọc", targetWord: "Mèo" }} onComplete={() => {}} />,
    );
    expect(spoken.map((item) => item.text)).toEqual(["Mèo"]);
  });

  it("reads the new source and stops the old one when the id changes", () => {
    const view = render(
      <WordCardActivity activity={{ id: "a", prompt: "Đọc", targetWord: "Mèo" }} onComplete={() => {}} />,
    );
    expect(spoken.map((item) => item.text)).toEqual(["Mèo"]);
    view.rerender(
      <WordCardActivity activity={{ id: "b", prompt: "Đọc", targetWord: "Chó" }} onComplete={() => {}} />,
    );
    expect(spoken.map((item) => item.text)).toEqual(["Mèo", "Chó"]);
    // Switching activities cancels the previous reading.
    expect(cancel).toHaveBeenCalled();
  });
});

describe("blocked autoplay is silent and leaves the speaker ready", () => {
  it("swallows a rejected play() with no error and keeps the button usable", async () => {
    play.mockRejectedValue(Object.assign(new Error("blocked"), { name: "NotAllowedError" }));
    render(<AudioButton audioUrl="/blocked.mp3" textToSpeak="Xin chào" autoPlay contentKey="x" />);
    expect(play).toHaveBeenCalledTimes(1);
    // Flush the rejected play() promise so onError runs.
    await act(async () => {});
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(spoken).toHaveLength(0);
    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("aria-pressed", "false");
  });
});

describe("autoplay yields to the wrong-answer replay without overlapping", () => {
  it("stops the auto-read when the child answers wrong and the hint replays", () => {
    render(
      <ListenChooseActivity
        activity={{
          id: "q1",
          prompt: "Con nghe thấy ai?",
          audioUrl: "/audio/q1.mp3",
          correctAnswer: "a",
          options: [
            { id: "a", text: "Mẹ" },
            { id: "b", text: "Bố" },
          ],
        }}
        onComplete={() => {}}
      />,
    );
    // The main speaker auto-reads once and owns playback.
    expect(play).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole("button")[0]).toHaveAttribute("aria-pressed", "true");
    play.mockClear();
    pause.mockClear();

    fireEvent.click(screen.getByRole("button", { name: "Bố" }));

    // The wrong-answer feedback claims playback: it replays once and the auto-read speaker stops.
    expect(play).toHaveBeenCalledTimes(1);
    expect(pause).toHaveBeenCalled();
    expect(screen.getAllByRole("button")[0]).toHaveAttribute("aria-pressed", "false");
  });
});
