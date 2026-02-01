import { render, screen, fireEvent } from "@testing-library/react";
import { Tooltip } from "./tooltip";

describe("Tooltip", () => {
  it("renders children correctly", () => {
    render(
      <Tooltip content="Tooltip content">
        <button>Trigger</button>
      </Tooltip>,
    );
    expect(screen.getByText("Trigger")).toBeInTheDocument();
  });

  it("shows content on hover", () => {
    render(
      <Tooltip content="Tooltip content">
        <button>Trigger</button>
      </Tooltip>,
    );

    const trigger = screen.getByText("Trigger");
    fireEvent.mouseEnter(trigger);

    expect(screen.getByText("Tooltip content")).toBeInTheDocument();
  });
});
