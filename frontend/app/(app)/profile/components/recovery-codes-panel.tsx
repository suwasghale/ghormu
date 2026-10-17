"use client"

import { useState } from "react"

import { Check, Copy, Download, KeyRound } from "lucide-react"

import { site } from "@/config/site"

type RecoveryCodesPanelProps = {
  codes: string[]
  onDone: () => void
}

/**
 * Shows freshly issued recovery codes.
 *
 * The server keeps only hashes, so this is the one moment the codes exist
 * in readable form. "Done" stays disabled until the person says they have
 * stored them.
 */
export default function RecoveryCodesPanel({
  codes,
  onDone,
}: RecoveryCodesPanelProps) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  const text = codes.join("\n")

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)

      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be refused; the codes stay visible to copy by hand.
    }
  }

  function handleDownload() {
    const blob = new Blob(
      [`${site.name} recovery codes\n\n${text}\n`],
      { type: "text/plain" },
    )

    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = "recovery-codes.txt"
    link.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <KeyRound className="mt-0.5 h-5 w-5 shrink-0" />

        <p>
          Store these recovery codes somewhere safe. Each one signs you in
          once if you lose access to your authenticator app.{" "}
          <strong>They will not be shown again.</strong>
        </p>
      </div>

      <ul className="grid grid-cols-2 gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-5 font-mono text-sm">
        {codes.map((code) => (
          <li
            key={code}
            className="rounded-lg bg-white px-3 py-2 text-center tracking-wider text-gray-900"
          >
            {code}
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copied" : "Copy"}
        </button>

        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-black hover:text-black"
        >
          <Download className="h-4 w-4" />
          Download
        </button>
      </div>

      <label className="flex items-center gap-3 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={saved}
          onChange={(event) => setSaved(event.target.checked)}
          className="h-4 w-4 rounded border-gray-300 accent-black"
        />
        I have saved my recovery codes
      </label>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={!saved}
          onClick={onDone}
          className="rounded-xl bg-black px-6 py-3 font-medium text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Done
        </button>
      </div>
    </div>
  )
}
