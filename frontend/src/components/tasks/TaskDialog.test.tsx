import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { TaskDialog } from "./TaskDialog";

describe("TaskDialog", () => {
  it("renders with dialog accessibility attributes", () => {
    const handleClose = vi.fn();

    render(
      <TaskDialog
        title="Tiêu đề thử nghiệm"
        titleId="test-title-id"
        descriptionId="test-desc-id"
        onClose={handleClose}
      >
        <p id="test-desc-id">Nội dung hộp thoại</p>
      </TaskDialog>,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "test-title-id");
    expect(dialog).toHaveAttribute("aria-describedby", "test-desc-id");
    expect(
      screen.getByRole("heading", { name: "Tiêu đề thử nghiệm" }),
    ).toBeInTheDocument();
  });

  it("locks body scroll while mounted and restores on unmount", () => {
    document.body.style.overflow = "visible";

    const { unmount } = render(
      <TaskDialog
        title="Scroll lock test"
        titleId="scroll-title"
        onClose={vi.fn()}
      >
        <p>Nội dung</p>
      </TaskDialog>,
    );

    expect(document.body.style.overflow).toBe("hidden");

    unmount();

    expect(document.body.style.overflow).toBe("visible");
  });

  it("sets initial focus to [data-dialog-initial-focus] element", () => {
    render(
      <TaskDialog
        title="Focus test"
        titleId="focus-title"
        onClose={vi.fn()}
      >
        <input type="text" placeholder="Bỏ qua" />
        <button type="button" data-dialog-initial-focus>
          Nút ưu tiên
        </button>
      </TaskDialog>,
    );

    expect(screen.getByRole("button", { name: "Nút ưu tiên" })).toHaveFocus();
  });

  it("closes on Escape key press when not busy", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <TaskDialog
        title="Escape test"
        titleId="escape-title"
        onClose={handleClose}
        isBusy={false}
      >
        <button type="button">Action</button>
      </TaskDialog>,
    );

    await user.keyboard("{Escape}");
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("does not close on Escape key press when busy", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <TaskDialog
        title="Busy escape test"
        titleId="busy-title"
        onClose={handleClose}
        isBusy={true}
      >
        <button type="button">Action</button>
      </TaskDialog>,
    );

    await user.keyboard("{Escape}");
    expect(handleClose).not.toHaveBeenCalled();
  });

  it("closes on close button click", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();

    render(
      <TaskDialog
        title="Close button test"
        titleId="close-btn-title"
        onClose={handleClose}
      >
        <p>Nội dung</p>
      </TaskDialog>,
    );

    await user.click(screen.getByRole("button", { name: "Đóng hộp thoại" }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("restores focus to previously active element on unmount", () => {
    const trigger = document.createElement("button");
    trigger.textContent = "Mở modal";
    document.body.appendChild(trigger);
    trigger.focus();

    expect(document.activeElement).toBe(trigger);

    const { unmount } = render(
      <TaskDialog
        title="Restore focus"
        titleId="restore-title"
        onClose={vi.fn()}
      >
        <button type="button">Trong modal</button>
      </TaskDialog>,
    );

    unmount();

    expect(document.activeElement).toBe(trigger);
    document.body.removeChild(trigger);
  });
});

