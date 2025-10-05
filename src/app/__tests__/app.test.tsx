import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../App";

describe("App smoke flows", () => {
  it("renders the default matchups on load", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: /sports sticks/i })).toBeInTheDocument();
    expect(screen.getByText(/Bengals vs Steelers/)).toBeInTheDocument();
    expect(screen.getByText(/Admin required to add a matchup\./i)).toBeInTheDocument();
  });

  it("unlocks admin-only controls after setting a PIN", () => {
    render(<App />);

    const pinInput = screen.getByPlaceholderText(/set new pin/i);
    fireEvent.change(pinInput, { target: { value: "1234" } });
    fireEvent.click(screen.getByRole("button", { name: /set pin/i }));

    expect(screen.queryByText(/Admin required to add a matchup\./i)).not.toBeInTheDocument();
    expect(screen.getByText(/Add a matchup/i)).toBeInTheDocument();
  });
});
