import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { ConfirmProvider, useConfirm } from "../ConfirmProvider";
import type { ConfirmOptions } from "../ConfirmDialog";

function Harness({ options }: { options: ConfirmOptions }) {
  const confirm = useConfirm();
  const [result, setResult] = useState("pending");

  return (
    <>
      <button
        onClick={async () => {
          const ok = await confirm(options);
          setResult(ok ? "confirmed" : "cancelled");
        }}
      >
        trigger
      </button>
      <div data-testid="result">{result}</div>
    </>
  );
}

const options: ConfirmOptions = {
  title: "Delete project?",
  description: "This cannot be undone.",
  confirmText: "Delete",
  variant: "destructive",
};

describe("ConfirmProvider", () => {
  it("does not show a dialog until confirm() is called", () => {
    render(
      <ConfirmProvider>
        <Harness options={options} />
      </ConfirmProvider>,
    );

    expect(screen.queryByText("Delete project?")).not.toBeInTheDocument();
  });

  it("opens with the given title and description", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmProvider>
        <Harness options={options} />
      </ConfirmProvider>,
    );

    await user.click(screen.getByText("trigger"));

    expect(await screen.findByText("Delete project?")).toBeInTheDocument();
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
  });

  it("resolves true when Confirm is clicked, and closes", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmProvider>
        <Harness options={options} />
      </ConfirmProvider>,
    );

    await user.click(screen.getByText("trigger"));
    await user.click(await screen.findByRole("button", { name: "Delete" }));

    expect(await screen.findByTestId("result")).toHaveTextContent("confirmed");
    expect(screen.queryByText("Delete project?")).not.toBeInTheDocument();
  });

  it("resolves false when Cancel is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmProvider>
        <Harness options={options} />
      </ConfirmProvider>,
    );

    await user.click(screen.getByText("trigger"));
    await user.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(await screen.findByTestId("result")).toHaveTextContent("cancelled");
  });

  it("resolves false on Escape", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmProvider>
        <Harness options={options} />
      </ConfirmProvider>,
    );

    await user.click(screen.getByText("trigger"));
    await screen.findByText("Delete project?");
    await user.keyboard("{Escape}");

    expect(await screen.findByTestId("result")).toHaveTextContent("cancelled");
  });
});

describe("useConfirm outside a provider", () => {
  it("throws instead of silently doing nothing", () => {
    // A destructive-action confirmation that silently no-ops would be a real
    // bug, so this must fail loudly -- suppress the expected React error
    // boundary console noise for this one assertion.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    function BareHarness() {
      useConfirm();
      return null;
    }

    expect(() => render(<BareHarness />)).toThrow(
      "useConfirm must be used within a ConfirmProvider",
    );

    consoleError.mockRestore();
  });
});
