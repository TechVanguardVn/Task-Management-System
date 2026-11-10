import { useState } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserPublic } from "../../types/auth";
import { Sidebar } from "./Sidebar";

const { useAuthMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
}));

vi.mock("../../context/AuthContext", () => ({
  useAuth: useAuthMock,
}));

const USER: UserPublic = {
  id: 7,
  email: "an@example.com",
  full_name: "An Nguyen",
};

function DrawerHarness() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)}>
        Open navigation
      </button>
      <Sidebar
        isMobileOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

function renderDrawer() {
  render(
    <MemoryRouter>
      <DrawerHarness />
    </MemoryRouter>,
  );
}

async function openDrawer() {
  renderDrawer();

  const user = userEvent.setup();
  const trigger = screen.getByRole("button", {
    name: "Open navigation",
  });

  await user.click(trigger);

  const dialog = screen.getByRole("dialog", {
    name: "Workspace navigation",
  });
  const closeButton = screen.getByRole("button", {
    name: "Close navigation",
  });

  return { user, trigger, dialog, closeButton };
}

describe("Sidebar mobile drawer", () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({ user: USER });
  });

  it("focuses the close button and closes on Escape with focus restored", async () => {
    const { user, trigger, closeButton } = await openDrawer();

    await waitFor(() => expect(closeButton).toHaveFocus());

    await user.keyboard("{Escape}");

    expect(
      screen.queryByRole("dialog", { name: "Workspace navigation" }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes after selecting a destination", async () => {
    const { user, dialog, trigger } = await openDrawer();

    await user.click(
      within(dialog).getByRole("link", { name: "Tasks" }),
    );

    expect(
      screen.queryByRole("dialog", { name: "Workspace navigation" }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("locks body scrolling while open and restores the previous value", async () => {
    document.body.style.overflow = "auto";

    const { user, closeButton } = await openDrawer();

    expect(document.body.style.overflow).toBe("hidden");

    await user.click(closeButton);

    expect(document.body.style.overflow).toBe("auto");
  });

  it("keeps keyboard focus inside the drawer", async () => {
    const { user, dialog, closeButton } = await openDrawer();

    await waitFor(() => expect(closeButton).toHaveFocus());

    const focusableLinks = within(dialog).getAllByRole("link");
    const firstLink = focusableLinks[0];
    const tasksLink = within(dialog).getByRole("link", { name: "Tasks" });

    expect(firstLink).toBeDefined();

    tasksLink.focus();
    await user.tab();

    expect(firstLink).toHaveFocus();
  });
});
