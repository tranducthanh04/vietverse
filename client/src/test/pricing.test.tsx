import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PricingPage } from "../features/public/PricingPage.js";

afterEach(cleanup);

it("shows the agreed monthly/yearly prices and a truthful annual comparison", () => {
  render(
    <MemoryRouter>
      <PricingPage />
    </MemoryRouter>,
  );
  expect(screen.getByText("250.000đ")).toBeInTheDocument();
  expect(screen.getByText("990.000đ")).toBeInTheDocument();
  expect(
    screen.getByText(/tiết kiệm 67% so với 12 tháng/i),
  ).toBeInTheDocument();
  expect(screen.queryByText("149.000đ")).not.toBeInTheDocument();
});
