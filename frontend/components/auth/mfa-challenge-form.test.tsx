// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { ApiError } from "@/lib/api/client"

const verifyMFA = vi.hoisted(() => vi.fn())
vi.mock("@/lib/api/auth/login", () => ({ verifyMFA }))

const { default: MfaChallengeForm } = await import("./mfa-challenge-form")

const onAuthenticated = vi.fn()
const onRestart = vi.fn()

function renderForm(expiresAt = Date.now() + 60_000) {
  return render(
    <MfaChallengeForm
      challenge={{ ticket: "ticket-1", expiresAt }}
      onAuthenticated={onAuthenticated}
      onRestart={onRestart}
    />,
  )
}

beforeEach(() => {
  verifyMFA.mockReset()
  onAuthenticated.mockReset()
  onRestart.mockReset()
})

describe("second-factor step", () => {
  it("completes sign-in with a valid code", async () => {
    const user = userEvent.setup()
    const session = { user: { id: "1" } }
    verifyMFA.mockResolvedValue(session)

    renderForm()

    await user.type(screen.getByLabelText("Authentication or recovery code"), "123456")
    await user.click(screen.getByRole("button", { name: "Verify code" }))

    expect(verifyMFA).toHaveBeenCalledWith("ticket-1", "123456")
    expect(onAuthenticated).toHaveBeenCalledWith(session)
  })

  it("restarts without calling the API once the ticket has expired", async () => {
    const user = userEvent.setup()

    renderForm(Date.now() - 1)

    await user.type(screen.getByLabelText("Authentication or recovery code"), "123456")
    await user.click(screen.getByRole("button", { name: "Verify code" }))

    expect(verifyMFA).not.toHaveBeenCalled()
    expect(onRestart).toHaveBeenCalledWith(expect.stringContaining("expired"))
  })

  it("restarts when the server rejects the ticket", async () => {
    const user = userEvent.setup()
    verifyMFA.mockRejectedValue(
      new ApiError("Unauthorized", 401, {
        message: "This sign-in attempt has expired.",
        code: "mfa_challenge_invalid",
      }),
    )

    renderForm()

    await user.type(screen.getByLabelText("Authentication or recovery code"), "123456")
    await user.click(screen.getByRole("button", { name: "Verify code" }))

    expect(onRestart).toHaveBeenCalledWith("This sign-in attempt has expired.")
  })

  it("keeps the ticket and clears the field after a wrong code", async () => {
    const user = userEvent.setup()
    verifyMFA.mockRejectedValue(
      new ApiError("Unauthorized", 401, { message: "Invalid one-time password.", code: "invalid_otp" }),
    )

    renderForm()

    const input = screen.getByLabelText("Authentication or recovery code")
    await user.type(input, "000000")
    await user.click(screen.getByRole("button", { name: "Verify code" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid one-time password.")
    expect(input).toHaveValue("")
    expect(onRestart).not.toHaveBeenCalled()
  })
})
