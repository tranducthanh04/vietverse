import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AudioButton } from "../components/ui/AudioButton.js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { api } from "../lib/api.js";
import { StoryDetailPage } from "../features/stories/StoryDetailPage.js";
import { CultureDetailPage } from "../features/culture/CultureDetailPage.js";
import { WordCardActivity } from "../features/lesson-player/activities/WordCardActivity.js";
import { FollowStepsActivity } from "../features/lesson-player/activities/FollowStepsActivity.js";
import { useUiLanguageStore } from "../i18n/index.js";

let spoken: SpeechSynthesisUtterance[];
let speechEvents: EventTarget;
let voices: SpeechSynthesisVoice[];
let cancel: ReturnType<typeof vi.fn>;
let play: ReturnType<typeof vi.spyOn>;
let pause: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  spoken = [];
  speechEvents = new EventTarget();
  voices = [
    {
      lang: "vi-VN",
      name: "Vietnamese",
      voiceURI: "vi",
      default: false,
      localService: true,
    },
  ];
  cancel = vi.fn();
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
    cancel,
    getVoices: () => voices,
    speak: (utterance: SpeechSynthesisUtterance) => {
      spoken.push(utterance);
      utterance.onstart?.(new Event("start") as SpeechSynthesisEvent);
    },
    addEventListener: speechEvents.addEventListener.bind(speechEvents),
    removeEventListener: speechEvents.removeEventListener.bind(speechEvents),
  });
  play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
  pause = vi
    .spyOn(HTMLMediaElement.prototype, "pause")
    .mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  useUiLanguageStore.setState({ manualLanguage: null });
});

describe("read aloud controls", () => {
  it("plays local audio assets rather than silently skipping the /audio path", async () => {
    render(<AudioButton audioUrl="/audio/word.mp3" textToSpeak="Xin chao" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1));
    expect(spoken).toHaveLength(0);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("falls back just once when media emits both error and a rejected play promise", async () => {
    let rejectPlay!: (reason: Error) => void;
    play.mockImplementation(
      () =>
        new Promise<void>((_, reject) => {
          rejectPlay = reject;
        }),
    );
    const { container } = render(
      <AudioButton audioUrl="/broken.mp3" textToSpeak="Xin chao" />,
    );
    fireEvent.click(screen.getByRole("button"));
    const element = container.querySelector("audio");
    expect(element).not.toBeNull();
    fireEvent.error(element!);
    await act(async () => {
      rejectPlay(new Error("broken"));
    });
    expect(spoken).toHaveLength(1);
    expect(spoken[0].text).toBe("Xin chao");
    expect(screen.getByText(/giọng đọc thiết bị/i)).toBeInTheDocument();
  });

  it("stops on a second click and ignores a late media rejection", async () => {
    let rejectPlay!: (reason: Error) => void;
    play.mockImplementation(
      () =>
        new Promise<void>((_, reject) => {
          rejectPlay = reject;
        }),
    );
    render(<AudioButton audioUrl="/late.mp3" textToSpeak="Xin chao" />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button"));
    await act(async () => {
      rejectPlay(new Error("late"));
    });
    expect(spoken).toHaveLength(0);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("stops the previous reader and an old unmount cannot cancel the new reader", () => {
    const first = render(<AudioButton textToSpeak="First" label="First" />);
    const second = render(<AudioButton textToSpeak="Second" label="Second" />);
    fireEvent.click(first.getByText("First"));
    fireEvent.click(second.getByText("Second"));
    expect(first.container.querySelector("button")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    const cancelled = cancel.mock.calls.length;
    first.unmount();
    expect(cancel).toHaveBeenCalledTimes(cancelled);
    expect(second.container.querySelector("button")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    second.unmount();
    expect(cancel.mock.calls.length).toBeGreaterThan(cancelled);
  });

  it("pauses a different media reader before starting speech", () => {
    const first = render(
      <AudioButton audioUrl="/one.mp3" label="First asset" />,
    );
    const second = render(
      <AudioButton textToSpeak="Second text" label="Second voice" />,
    );
    fireEvent.click(first.getByText("First asset"));
    pause.mockClear();
    fireEvent.click(second.getByText("Second voice"));
    expect(pause.mock.contexts).toContain(
      first.container.querySelector("audio"),
    );
    expect(first.container.querySelector("button")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(spoken.map((item) => item.text)).toEqual(["Second text"]);
  });

  it("reads all long-form text without losing words between chunks", () => {
    const passage = Array.from(
      { length: 90 },
      (_, index) => `word${index}`,
    ).join(" ");
    render(<AudioButton textToSpeak={passage} />);
    fireEvent.click(screen.getByRole("button"));
    let cursor = 0;
    while (cursor < spoken.length && cursor < 20) {
      const utterance = spoken[cursor++];
      act(() =>
        utterance.onend?.call(
          utterance,
          new Event("end") as SpeechSynthesisEvent,
        ),
      );
    }
    expect(spoken.length).toBeGreaterThan(1);
    expect(spoken.map((item) => item.text).join(" ")).toBe(passage);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("does not restart speech from a stale event after content changes", () => {
    const view = render(<AudioButton textToSpeak="Old" />);
    fireEvent.click(screen.getByRole("button"));
    const oldEnd = spoken[0].onend;
    view.rerender(<AudioButton textToSpeak="New" />);
    act(() =>
      oldEnd?.call(spoken[0], new Event("end") as SpeechSynthesisEvent),
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
    expect(spoken).toHaveLength(1);
  });

  it("rewinds an unchanged asset when switching to a different content identity", () => {
    const view = render(
      <AudioButton
        audioUrl="/shared.mp3"
        textToSpeak="Text"
        contentKey="first"
      />,
    );
    const audio = view.container.querySelector("audio")!;
    fireEvent.click(screen.getByRole("button"));
    audio.currentTime = 12;
    fireEvent.timeUpdate(audio);
    view.rerender(
      <AudioButton
        audioUrl="/shared.mp3"
        textToSpeak="Text"
        contentKey="second"
      />,
    );
    expect(audio.currentTime).toBe(0);
    expect(pause).toHaveBeenCalled();
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("does not read a button label as lesson content", () => {
    render(<AudioButton label="Nghe doc" />);
    expect(screen.getByRole("button")).toBeDisabled();
    expect(spoken).toHaveLength(0);
  });

  it("waits for a matching voice instead of reading Vietnamese with an English voice", () => {
    vi.useFakeTimers();
    voices = [{ ...voices[0], lang: "en-US" }];
    render(<AudioButton textToSpeak="Xin chao" />);
    fireEvent.click(screen.getByRole("button"));
    expect(spoken).toHaveLength(0);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByRole("status")).toHaveTextContent(
      /cùng đọc trên màn hình/i,
    );
    // The friendly fallback must not expose a raw BCP 47 locale code to families.
    expect(screen.getByRole("status")).not.toHaveTextContent(/vi-VN/i);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
  });

  it("loads voices asynchronously and chooses the requested companion locale", () => {
    voices = [];
    render(<AudioButton textToSpeak="Hello" lang="en-US" />);
    fireEvent.click(screen.getByRole("button"));
    expect(spoken).toHaveLength(0);
    act(() => {
      voices = [{ lang: "en-US", name: "English" } as SpeechSynthesisVoice];
      speechEvents.dispatchEvent(new Event("voiceschanged"));
    });
    expect(spoken).toHaveLength(1);
    expect(spoken[0].lang).toBe("en-US");
    expect(spoken[0].voice).toBe(voices[0]);
  });

  it("does not auto-read when an asset fails before a click", () => {
    const { container } = render(
      <AudioButton audioUrl="/broken.mp3" textToSpeak="Text" />,
    );
    fireEvent.error(container.querySelector("audio")!);
    expect(spoken).toHaveLength(0);
  });

  it("cancels pending voice discovery when stopped", () => {
    vi.useFakeTimers();
    voices = [];
    render(<AudioButton textToSpeak="Text" />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button"));
    act(() => {
      vi.advanceTimersByTime(2000);
      speechEvents.dispatchEvent(new Event("voiceschanged"));
    });
    expect(spoken).toHaveLength(0);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

function showPage(element: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/content/one"]}>
        <Routes>
          <Route path="/content/:id" element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("narration in learning journeys", () => {
  it("reads story lines in order without pretending device speech is a timed recording", async () => {
    vi.spyOn(api, "get").mockResolvedValue({
      data: {
        data: {
          title: "Story",
          lyrics: [
            { timeSec: 0, text: "Line one" },
            { timeSec: 5, text: "Line two" },
          ],
          durationSec: 30,
        },
      },
    });
    const view = showPage(<StoryDetailPage />);
    fireEvent.click(
      await screen.findByRole("button", { name: "Bắt đầu nghe" }),
    );
    expect(spoken.map((item) => item.text)).toEqual(["Line one"]);
    expect(screen.getByLabelText("Tua thời gian bài đồng dao")).toBeDisabled();
    expect(screen.getByText(/giọng đọc thiết bị/i)).toBeInTheDocument();
    expect(
      screen.queryByText("Đang phát lời theo nhạc"),
    ).not.toBeInTheDocument();
    act(() =>
      spoken[0].onend?.call(
        spoken[0],
        new Event("end") as SpeechSynthesisEvent,
      ),
    );
    expect(spoken.map((item) => item.text)).toEqual(["Line one", "Line two"]);
    const lateEnd = spoken[1].onend;
    view.unmount();
    act(() =>
      lateEnd?.call(spoken[1], new Event("end") as SpeechSynthesisEvent),
    );
    expect(spoken).toHaveLength(2);
  });

  it("culture falls back on a media error after playback has begun", async () => {
    vi.spyOn(api, "get").mockResolvedValue({
      data: {
        data: {
          title: "Culture",
          intro: "Introduction",
          funFacts: ["A fact"],
          audioUrl: "/culture.mp3",
        },
      },
    });
    const view = showPage(<CultureDetailPage />);
    fireEvent.click(await screen.findByRole("button", { name: /kể chuyện/i }));
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1));
    fireEvent.error(view.container.querySelector("audio")!);
    expect(spoken.length).toBeGreaterThan(0);
    expect(screen.getByText(/giọng đọc thiết bị/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /dừng đọc/i }));
    expect(cancel).toHaveBeenCalled();
  });

  it("reads the full passage separately from the short target-word asset", () => {
    render(
      <WordCardActivity
        activity={{
          id: "word",
          prompt: "Read",
          subPrompt: "A full passage.",
          targetWord: "Word",
          audioUrl: "/word.mp3",
        }}
        onComplete={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Đọc đoạn văn" }));
    expect(spoken.map((item) => item.text)).toEqual(["A full passage."]);
    expect(play).not.toHaveBeenCalled();
  });

  it("reads a legacy target-word passage without completing the activity", () => {
    const passage = "A full reading passage stored in targetWord.";
    const complete = vi.fn();
    render(
      <WordCardActivity
        activity={{ id: "legacy-passage", prompt: "Read", targetWord: passage }}
        onComplete={complete}
      />,
    );
    expect(screen.getByText(passage)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Nghe đọc" }));
    expect(spoken.map((item) => item.text)).toEqual([passage]);
    act(() => spoken[0].onend?.call(spoken[0], new Event("end") as SpeechSynthesisEvent));
    expect(complete).not.toHaveBeenCalled();
  });

  it("reads game instructions without completing or grading the activity", () => {
    const submit = vi.fn();
    render(
      <FollowStepsActivity
        activity={{
          id: "steps",
          type: "follow_steps",
          prompt: "Listen",
          steps: [{ id: "a", text: "Step one" }],
        }}
        value={[]}
        onChange={() => {}}
        onSubmit={submit}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Nghe hướng dẫn" }));
    expect(spoken[0].text).toContain("Step one");
    expect(submit).not.toHaveBeenCalled();
  });
});

describe("device speech robustness", () => {
  it("matches Android voices that report vi_VN", () => {
    voices = [{ ...voices[0], lang: "vi_VN" }];
    render(<AudioButton textToSpeak="Xin chao" />);
    fireEvent.click(screen.getByRole("button"));
    expect(spoken).toHaveLength(1);
    expect(spoken[0].voice).toBe(voices[0]);
  });

  it("releases a speech engine that never starts and shows the error", () => {
    vi.useFakeTimers();
    vi.stubGlobal("speechSynthesis", {
      cancel,
      getVoices: () => voices,
      speak: (utterance: SpeechSynthesisUtterance) => {
        spoken.push(utterance); // blocked engine: no onstart
      },
      addEventListener: speechEvents.addEventListener.bind(speechEvents),
      removeEventListener: speechEvents.removeEventListener.bind(speechEvents),
    });
    render(<AudioButton textToSpeak="Xin chao" />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(cancel).toHaveBeenCalled();
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("status")).toHaveTextContent(/cùng đọc trên màn hình/i);
  });

  it("unlocks iOS speech synchronously inside the tap before reading", () => {
    vi.spyOn(navigator, "userAgent", "get").mockReturnValue(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
    );
    render(<AudioButton textToSpeak="Xin chao" />);
    fireEvent.click(screen.getByRole("button"));
    expect(spoken.map((item) => item.text)).toEqual(["", "Xin chao"]);
  });

  it("hides the device-voice label until the reader actually starts", () => {
    render(<AudioButton textToSpeak="Xin chao" />);
    // A freshly loaded page must not greet families with a fallback warning.
    expect(screen.queryByText(/giọng đọc thiết bị/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/giọng đọc thiết bị/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText(/giọng đọc thiết bị/i)).not.toBeInTheDocument();
  });

  it("speaks the missing-voice notice in the active interface language", () => {
    useUiLanguageStore.setState({ manualLanguage: "en" });
    vi.useFakeTimers();
    voices = [];
    render(<AudioButton textToSpeak="Xin chao" />);
    fireEvent.click(screen.getByRole("button"));
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(/read along on the screen/i);
    // No Vietnamese copy and no raw locale code should leak into the English UI.
    expect(status).not.toHaveTextContent(/màn hình/);
    expect(status).not.toHaveTextContent(/vi-VN/i);
  });
});
