// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClientProvider } from "@tanstack/react-query"

import { ApiError } from "@/lib/api/client"
import { queryClient } from "@/lib/query/client"
import type { MfaStatus } from "@/types/security"

const api = vi.hoisted(() => ({
  getMfaStatus: vi.fn<() => Promise<MfaStatus>>(),
  startMfaEnrolment: vi.fn(),
  confirmMfaEnrolment: vi.fn(),
  regenerateRecoveryCodes: vi.fn(),
  disableMfa: vi.fn(),
}))

vi.mock("@/lib/api/auth/mfa", () => api)

const { default: TwoFactorCard } = await import("./two-factor-card")

const CODES = ["AAAA-111111", "BBBB-222222"]

function renderCard() {
  return render(
    <QueryClientProvider client={queryClient}>
      <TwoFactorCard />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  queryClient.clear()
  Object.values(api).forEach((mock) => mock.mockReset())
})

describe("two-factor setup", () => {
  it("enrols, confirms and shows recovery codes once", async () => {
    const user = userEvent.setup()

    api.getMfaStatus.mockResolvedValue({ enabled: false, recovery_codes_remaining: 0 })
    api.startMfaEnrolment.mockResolvedValue({
      secret: "JBSWY3DPEHPK3PXP",
      provisioning_uri: "otpauth://totp/Test:a@b.test?secret=JBSWY3DPEHPK3PXP",
    })
    api.confirmMfaEnrolment.mockResolvedValue(CODES)

    renderCard()

    await user.click(await screen.findByRole("button", { name: "Set up" }))

    expect(await screen.findByText("JBSW Y3DP EHPK 3PXP")).toBeInTheDocument()
    expect(screen.getByTitle("Authenticator setup QR code")).toBeInTheDocument()

    api.getMfaStatus.mockResolvedValue({ enabled: true, recovery_codes_remaining: 2 })

    await user.type(screen.getByLabelText("Verification code"), "123456")
    await user.click(screen.getByRole("button", { name: "Turn on" }))

    expect(api.confirmMfaEnrolment).toHaveBeenCalledWith("123456")
    expect(await screen.findByText(CODES[0])).toBeInTheDocument()

    const done = screen.getByRole("button", { name: "Done" })
    expect(done).toBeDisabled()

    await user.click(screen.getByLabelText("I have saved my recovery codes"))
    await user.click(done)

    expect(await screen.findByText(/unused recovery/)).toBeInTheDocument()
    expect(screen.queryByText(CODES[0])).not.toBeInTheDocument()
  })

  it("clears a rejected code and shows the server message", async () => {
    const user = userEvent.setup()

    api.getMfaStatus.mockResolvedValue({ enabled: false, recovery_codes_remaining: 0 })
    api.startMfaEnrolment.mockResolvedValue({ secret: "JBSWY3DPEHPK3PXP", provisioning_uri: "otpauth://x" })
    api.confirmMfaEnrolment.mockRejectedValue(
      new ApiError("Unauthorized", 401, { message: "Invalid one-time password.", code: "invalid_otp" }),
    )

    renderCard()

    await user.click(await screen.findByRole("button", { name: "Set up" }))
    const input = await screen.findByLabelText("Verification code")
    await user.type(input, "000000")
    await user.click(screen.getByRole("button", { name: "Turn on" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid one-time password.")
    expect(input).toHaveValue("")
  })
})

describe("managing an enabled factor", () => {
  it("warns when recovery codes are running low", async () => {
    api.getMfaStatus.mockResolvedValue({ enabled: true, recovery_codes_remaining: 1 })

    renderCard()

    expect(await screen.findByText(/running low on recovery codes/)).toBeInTheDocument()
  })

  it("asks for the password first when turning it off", async () => {
    const user = userEvent.setup()

    api.getMfaStatus.mockResolvedValue({ enabled: true, recovery_codes_remaining: 10 })
    api.disableMfa.mockResolvedValue(undefined)

    renderCard()

    await user.click(await screen.findByRole("button", { name: "Turn off" }))

    expect(screen.getByLabelText("Current password")).toHaveFocus()

    api.getMfaStatus.mockResolvedValue({ enabled: false, recovery_codes_remaining: 0 })

    await user.keyboard("secret-password")
    await user.type(screen.getByLabelText("Authentication or recovery code"), "123456")
    await user.click(screen.getAllByRole("button", { name: "Turn off" }).at(-1)!)

    expect(api.disableMfa).toHaveBeenCalledWith({ password: "secret-password", code: "123456" })
    expect(await screen.findByText("Two-factor authentication has been turned off.")).toBeInTheDocument()
  })
})
