import React, { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { SupportTranslation } from "../components/ui/SupportTranslation.js";
import { TranslationEditor, TranslationPreview, type Translations } from "../features/admin/content/TranslationEditor.js";
import { useChildStore } from "../store/childStore.js";

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
