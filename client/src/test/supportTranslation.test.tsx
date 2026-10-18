import React, { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SupportTranslation } from "../components/ui/SupportTranslation.js";
import { TranslationEditor, TranslationPreview, type Translations } from "../features/admin/content/TranslationEditor.js";
import { useChildStore } from "../store/childStore.js";
import { StoryEditor } from "../features/admin/content/StoryEditor.js";
import { CultureEditor } from "../features/admin/content/CultureEditor.js";
import type { StoryContent, CultureContent } from "../features/admin/content/content.types.js";

afterEach(() => {
  cleanup();
  useChildStore.setState({ activeChild: null, children: [] });
});

function setActiveChild(companionLanguages: string[]) {
  useChildStore.setState({
    activeChild: {
      _id: "c1",
      companionLanguage: companionLanguages[0],
      companionLanguages,
    } as never,
  });
}

const cultureTranslations = {
  en: { intro: "English intro", funFacts: ["First fact in English"] },
  ja: { intro: "日本語の紹介" },
};

describe("SupportTranslation (child view)", () => {
  it("shows the first companion language that has a translation, in priority order", () => {
    setActiveChild(["ko", "ja", "en"]);
    render(
      <SupportTranslation
        translations={cultureTranslations}
        select={(t: { intro?: string }) => t.intro}
      />,
    );
    // Korean has none, Japanese is next and does have one.
    const line = screen.getByText("日本語の紹介");
    expect(line).toHaveAttribute("lang", "ja");
    expect(screen.queryByText("English intro")).not.toBeInTheDocument();
  });

  it("falls through to the next language when the preferred one lacks that field", () => {
    setActiveChild(["ja", "en"]);
    render(
      <SupportTranslation
        translations={cultureTranslations}
        select={(t: { funFacts?: string[] }) => t.funFacts?.[0]}
      />,
    );
    // Japanese has no funFacts, so English is used for this specific field.
    const line = screen.getByText("First fact in English");
    expect(line).toHaveAttribute("lang", "en");
  });

  it("renders nothing when no child is selected", () => {
    const { container } = render(
      <SupportTranslation
        translations={cultureTranslations}
        select={(t: { intro?: string }) => t.intro}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when no companion language has a translation", () => {
    setActiveChild(["fr", "ko"]);
    const { container } = render(
      <SupportTranslation
        translations={cultureTranslations}
        select={(t: { intro?: string }) => t.intro}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("ignores the 'other' companion language", () => {
    setActiveChild(["other", "en"]);
    render(
      <SupportTranslation
        translations={cultureTranslations}
        select={(t: { intro?: string }) => t.intro}
      />,
    );
    expect(screen.getByText("English intro")).toHaveAttribute("lang", "en");
  });
});

describe("TranslationEditor (CMS)", () => {
  const sections = [
    { kind: "text" as const, key: "intro", label: "Mở đầu", multiline: true },
    { kind: "list" as const, key: "funFacts", label: "Thông tin thú vị", source: ["Sự thật một"] },
  ];

  function Form() {
    const [value, setValue] = useState<Translations>({});
    return (
      <>
        <TranslationEditor translations={value} onChange={setValue} sections={sections} />
        <output>{JSON.stringify(value)}</output>
      </>
    );
  }

  it("writes a text translation under the chosen language", () => {
    render(<Form />);
    fireEvent.change(screen.getByLabelText("Tiếng Anh · Mở đầu"), {
      target: { value: "English intro" },
    });
    expect(JSON.parse(screen.getByRole("status").textContent!)).toEqual({
      en: { intro: "English intro" },
    });
  });

  it("keeps list translations parallel to the Vietnamese source by index", () => {
    render(<Form />);
    fireEvent.change(screen.getByLabelText("Tiếng Anh · Thông tin thú vị 1"), {
      target: { value: "First fact in English" },
    });
    expect(JSON.parse(screen.getByRole("status").textContent!)).toEqual({
      en: { funFacts: ["First fact in English"] },
    });
    // The source text is offered as a placeholder so translators see the original.
    expect(screen.getByLabelText("Tiếng Anh · Thông tin thú vị 1")).toHaveAttribute(
      "placeholder",
      "Sự thật một",
    );
  });

  it("drops cleared fields and empty languages instead of saving blank strings", () => {
    render(<Form />);
    const intro = screen.getByLabelText("Tiếng Anh · Mở đầu");
    fireEvent.change(intro, { target: { value: "English intro" } });
    fireEvent.change(intro, { target: { value: "" } });
    expect(JSON.parse(screen.getByRole("status").textContent!)).toEqual({});
  });
});

describe("TranslationPreview (CMS)", () => {
  it("lists only filled translations with the correct lang attribute", () => {
    render(
      <TranslationPreview
        translations={cultureTranslations as Translations}
        sections={[
          { key: "intro", label: "Mở đầu" },
          { key: "funFacts", label: "Thông tin thú vị", list: true },
        ]}
      />,
    );
    expect(screen.getByText("English intro")).toBeInTheDocument();
    expect(screen.getByText("日本語の紹介")).toBeInTheDocument();
    expect(screen.getByText("First fact in English")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tiếng Nhật" })).toBeInTheDocument();
  });

  it("renders nothing when there are no translations", () => {
    const { container } = render(
      <TranslationPreview translations={{}} sections={[{ key: "intro", label: "Mở đầu" }]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

function SourceForm({ field, translations }: {
  field: "lyrics" | "vocab" | "funFacts";
  translations?: Translations;
}) {
  const [story, setStory] = useState<StoryContent>({
    title: "Source title", type: "tho", author: "", description: "",
    audioUrl: "", coverImage: "", durationSec: 0, ageGroups: ["5-6"], quiz: [],
    lyrics: [{ text: "Same source", timeSec: 0 }, { text: "Same source", timeSec: 1 }],
    vocab: ["Same source", "Same source"], translations,
  });
  const [culture, setCulture] = useState<CultureContent>({
    title: "Source title", category: "tet", intro: "", audioUrl: "", coverImage: "",
    funFacts: ["Same source", "Same source"], tags: [], quiz: [], translations,
  });
  return <>
    {field === "funFacts"
      ? <CultureEditor value={culture} onChange={setCulture} />
      : <StoryEditor value={story} onChange={setStory} />}
    <output>{JSON.stringify(field === "funFacts" ? culture : story)}</output>
  </>;
}

describe.each([
  { field: "lyrics" as const, remove: "Xóa dòng 1", move: "Đưa dòng 2 lên", add: "Thêm dòng lời", input: "Dòng lời 1", translated: "Tiếng Anh · Dòng lời 1" },
  { field: "vocab" as const, remove: "Xóa Từ truyện 1", move: "Đưa Từ truyện 2 lên", add: "Thêm từ truyện", input: "Từ truyện 1", translated: "Tiếng Anh · Từ vựng 1" },
  { field: "funFacts" as const, remove: "Xóa Thông tin thú vị 1", move: "Đưa Thông tin thú vị 2 lên", add: "Thêm thông tin thú vị", input: "Thông tin thú vị 1", translated: "Tiếng Anh · Thông tin thú vị 1" },
])("CMS source rows: $field", ({ field, remove, move, add, input, translated }) => {
  const readValue = () => JSON.parse(screen.getByRole("status").textContent!) as StoryContent & CultureContent;
  const translations = (): Translations => ({
    en: { title: "English title", [field]: ["First English", "Second English"] },
    fr: { title: "French title", [field]: ["First French", "Second French"] },
    ja: { title: "Japanese title" },
  });

  it("removes the matching translation in every language, even with duplicate source text", () => {
    render(<SourceForm field={field} translations={translations()} />);
    fireEvent.click(screen.getByRole("button", { name: remove }));
    expect(readValue()[field]).toHaveLength(1);
    expect(readValue().translations).toEqual({
      en: { title: "English title", [field]: ["Second English"] },
      fr: { title: "French title", [field]: ["Second French"] },
      ja: { title: "Japanese title" },
    });
    expect(screen.getByLabelText(translated)).toHaveValue("Second English");
  });

  it("moves translations with their source rows in every language", () => {
    render(<SourceForm field={field} translations={translations()} />);
    fireEvent.click(screen.getByRole("button", { name: move }));
    expect(readValue().translations).toEqual({
      en: { title: "English title", [field]: ["Second English", "First English"] },
      fr: { title: "French title", [field]: ["Second French", "First French"] },
      ja: { title: "Japanese title" },
    });
    expect(screen.getByLabelText(translated)).toHaveValue("Second English");
  });

  it("keeps untranslated positions empty when moving a partially translated list", () => {
    render(<SourceForm field={field} translations={{ en: { [field]: ["First English"] } }} />);
    fireEvent.click(screen.getByRole("button", { name: move }));
    expect(readValue().translations?.en?.[field]).toEqual(["", "First English"]);
    expect(screen.getByLabelText(translated)).toHaveValue("");
  });

  it("does not attach a stale translation beyond the source length to an appended row", () => {
    render(<SourceForm field={field} translations={{ en: { [field]: ["First English", "Second English", "Orphan"] } }} />);
    fireEvent.click(screen.getByRole("button", { name: add }));
    expect(readValue()[field]).toHaveLength(3);
    expect(readValue().translations?.en?.[field]).toEqual(["First English", "Second English", ""]);
  });

  it("does not resurrect a deleted translation when a new source row is added", () => {
    render(<SourceForm field={field} translations={{ en: { [field]: ["First English"] } }} />);
    fireEvent.click(screen.getByRole("button", { name: remove }));
    fireEvent.click(screen.getByRole("button", { name: add }));
    expect(readValue().translations?.en?.[field]).toBeUndefined();
    expect(screen.getByLabelText(translated)).toHaveValue("");
  });

  it("preserves translations when editing source text without changing row identity", () => {
    render(<SourceForm field={field} translations={translations()} />);
    fireEvent.change(screen.getByLabelText(input), { target: { value: "Edited source" } });
    expect(readValue().translations).toEqual(translations());
  });

  it("keeps legacy content without translations editable", () => {
    render(<SourceForm field={field} />);
    fireEvent.click(screen.getByRole("button", { name: move }));
    fireEvent.click(screen.getByRole("button", { name: remove }));
    fireEvent.click(screen.getByRole("button", { name: add }));
    expect(readValue()[field]).toHaveLength(2);
    expect(readValue().translations).toBeUndefined();
  });
});
