// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const social = vi.hoisted(() => ({
  getSocialProviders: vi.fn<() => Promise<string[]>>(),
  startSocialSignIn: vi.fn(),
}))

vi.mock("@/lib/api/auth/social", () => social)

const { default: SocialSignIn } = await import("./social-sign-in")

function renderButtons() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  return render(
    <QueryClientProvider client={client}>
      <SocialSignIn />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  social.getSocialProviders.mockReset()
  social.startSocialSignIn.mockReset()
})

describe("social sign-in buttons", () => {
  it("renders nothing when no provider is configured", async () => {
    social.getSocialProviders.mockResolvedValue([])

    const { container } = renderButtons()

    await vi.waitFor(() => expect(social.getSocialProviders).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it("starts the provider flow, carrying the return path", async () => {
    const user = userEvent.setup()
    social.getSocialProviders.mockResolvedValue(["google"])
    social.startSocialSignIn.mockReturnValue(new Promise(() => {}))
    window.history.replaceState(null, "", "/login?next=%2Fprofile%2Ftwo-factor")

    renderButtons()

    await user.click(await screen.findByRole("button", { name: "Continue with Google" }))

    expect(social.startSocialSignIn).toHaveBeenCalledWith("google", "/profile/two-factor")
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeDisabled()
  })

  it("reports a provider that cannot be started", async () => {
    const user = userEvent.setup()
    social.getSocialProviders.mockResolvedValue(["google"])
    social.startSocialSignIn.mockRejectedValue(new Error("Sign-in with this provider is unavailable."))

    renderButtons()

    await user.click(await screen.findByRole("button", { name: "Continue with Google" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("unavailable")
  })
})
