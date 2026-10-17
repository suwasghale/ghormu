// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider } from "@tanstack/react-query"

import { ApiError } from "@/lib/api/client"
import { queryClient } from "@/lib/query/client"
import type { MfaStatus } from "@/types/security"

const mocks = vi.hoisted(() => ({
  replace: vi.fn(),
  deleteAccount: vi.fn(),
  logout: vi.fn(),
  getMfaStatus: vi.fn<() => Promise<MfaStatus>>(),
}))

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace }) }))
vi.mock("@/lib/api/auth/delete-account", () => ({ deleteAccount: mocks.deleteAccount }))
vi.mock("@/lib/auth/logout", () => ({ logout: mocks.logout }))
vi.mock("@/lib/api/auth/mfa", () => ({ getMfaStatus: mocks.getMfaStatus }))
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const { default: DeleteAccountDialog } = await import("./delete-account-dialog")

function renderDialog() {
  return render(
    <QueryClientProvider client={queryClient}>
      <DeleteAccountDialog open onClose={() => {}} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  queryClient.clear()
  Object.values(mocks).forEach((mock) => mock.mockReset())
  mocks.deleteAccount.mockResolvedValue({ success: true, message: "Your account has been deleted successfully." })
})

describe("delete account dialog", () => {
  it("needs only the password without two-factor", async () => {
    const user = userEvent.setup()
    mocks.getMfaStatus.mockResolvedValue({ enabled: false, recovery_codes_remaining: 0 })

    renderDialog()

    expect(screen.getByLabelText("Confirm with your password")).toHaveFocus()
    expect(screen.queryByLabelText("Authentication or recovery code")).not.toBeInTheDocument()

    await user.keyboard("my-password")
    await user.click(screen.getByRole("button", { name: "Delete my account" }))

    expect(mocks.deleteAccount).toHaveBeenCalledWith({ password: "my-password", code: undefined })
    expect(mocks.logout).toHaveBeenCalled()
    expect(mocks.replace).toHaveBeenCalledWith("/login")
  })

  it("asks for a code when two-factor is on", async () => {
    const user = userEvent.setup()
    mocks.getMfaStatus.mockResolvedValue({ enabled: true, recovery_codes_remaining: 10 })

    renderDialog()

    const code = await screen.findByLabelText("Authentication or recovery code")
    const submit = screen.getByRole("button", { name: "Delete my account" })

    await user.keyboard("my-password")
    expect(submit).toBeDisabled()

    await user.type(code, "123456")
    await user.click(submit)

    expect(mocks.deleteAccount).toHaveBeenCalledWith({ password: "my-password", code: "123456" })
  })

  it("reveals the code field when the server asks for one", async () => {
    const user = userEvent.setup()
    mocks.getMfaStatus.mockRejectedValue(new Error("status unavailable"))
    mocks.deleteAccount.mockRejectedValueOnce(
      new ApiError("Bad Request", 400, {
        message: "Enter a code from your authenticator app or one of your recovery codes.",
        code: "mfa_code_required",
      }),
    )

    renderDialog()

    await user.keyboard("my-password")
    await user.click(screen.getByRole("button", { name: "Delete my account" }))

    expect(await screen.findByLabelText("Authentication or recovery code")).toBeInTheDocument()
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a code from your authenticator app")
    expect(mocks.logout).not.toHaveBeenCalled()
  })

  it("keeps the session when the password is wrong", async () => {
    const user = userEvent.setup()
    mocks.getMfaStatus.mockResolvedValue({ enabled: false, recovery_codes_remaining: 0 })
    mocks.deleteAccount.mockRejectedValueOnce(
      new ApiError("Bad Request", 400, { message: "Current password is incorrect.", code: "invalid_password" }),
    )

    renderDialog()

    await user.keyboard("wrong")
    await user.click(screen.getByRole("button", { name: "Delete my account" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Current password is incorrect.")
    expect(mocks.logout).not.toHaveBeenCalled()
    expect(mocks.replace).not.toHaveBeenCalled()
  })
})
