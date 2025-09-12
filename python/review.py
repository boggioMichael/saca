#!/usr/bin/env python
import os
import sys
import argparse
import json
from pathlib import Path

try:
    from openai import OpenAI
except Exception as e:
    # We still want logging to work even if openai isn't installed yet.
    OpenAI = None

REPORT_PROMPT = (
    "You are a meticulous senior code reviewer.\n"
    "Task: return a concise Markdown review and an optional complete revised file.\n"
    "Output MUST be valid JSON with keys:\n"
    " - report_markdown: string (always present)\n"
    " - revised_code: string or null (full file content if you propose edits)\n"
    "\n"
    "Guidelines:\n"
    "1) Summary - one paragraph.\n"
    "2) Issues - bullet list with severity (High/Med/Low).\n"
    "3) Suggested Improvements - bullets with code pointers.\n"
    "If you propose substantial changes, include 'revised_code' as the entire corrected file.\n"
    "Preserve language and style. Do not invent APIs. If no change is needed, set revised_code to null.\n"
)

def log(msg: str):
    """Write to stderr so the VS Code OutputChannel shows it as [review.py][stderr]."""
    sys.stderr.write(f"[review.py] {msg}\n")
    sys.stderr.flush()

def mock_response(code: str) -> dict:
    """Return a deterministic mock response for testing."""
    revised = "// MOCK REVISION ADDED BY review.py\n" + code
    return {
        "report_markdown": "### MOCK Review\n- This is a mock review, no API call.\n- Demonstrates logging + diff flow.",
        "revised_code": revised
    }

def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("file", help="Path to source file to review")
    parser.add_argument("--model", default=os.environ.get("SACA_MODEL", "gpt-4o-mini"))
    parser.add_argument("--json", action="store_true", help="Force JSON output (used by VS Code)")
    args = parser.parse_args()

    log("Starting review.py")
    log(f"Model: {args.model}")
    log(f"Target file: {args.file}")

    api_key = os.environ.get("OPENAI_API_KEY")
    mock_mode = os.environ.get("SACA_MOCK") == "1"
    log(f"OPENAI_API_KEY set? {bool(api_key)}")
    log(f"SACA_MOCK mode? {mock_mode}")

    file_path = Path(args.file)
    if not file_path.exists():
        msg = f"ERROR: file not found: {file_path}"
        log(msg)
        print(json.dumps({"report_markdown": msg, "revised_code": None}))
        return 2

    try:
        code = file_path.read_text(encoding="utf-8", errors="ignore")
    except Exception as e:
        msg = f"ERROR: failed reading file: {e}"
        log(msg)
        print(json.dumps({"report_markdown": msg, "revised_code": None}))
        return 2

    log(f"Read {len(code)} chars from {file_path}")

    if mock_mode:
        log("Returning mock review + revision (no API call).")
        out = mock_response(code)
        print(json.dumps(out))
        return 0

    if not api_key:
        msg = "ERROR: OPENAI_API_KEY not set and not in mock mode."
        log(msg)
        print(json.dumps({"report_markdown": msg, "revised_code": None}))
        return 2

    if OpenAI is None:
        msg = "ERROR: openai python package not installed. Run: pip install -r python/requirements.txt"
        log(msg)
        print(json.dumps({"report_markdown": msg, "revised_code": None}))
        return 2

    try:
        client = OpenAI(api_key=api_key)
        log("Sending request to OpenAI...")
        completion = client.chat.completions.create(
            model=args.model,
            messages=[
                {"role": "system", "content": REPORT_PROMPT},
                {"role": "user", "content": f"Filename: {file_path.name}\n\n```{file_path.suffix.lstrip('.')}\n{code}\n```"},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        log("Received response from OpenAI.")
        raw = completion.choices[0].message.content or "{}"
        data = json.loads(raw)

        report = data.get("report_markdown", "")
        revised = data.get("revised_code", None)
        log(f"Parsed JSON: report length={len(report)}, revised_code? {bool(revised)}")

        print(json.dumps({"report_markdown": report, "revised_code": revised or None}))
        return 0

    except Exception as e:
        msg = f"ERROR during OpenAI call: {e}"
        log(msg)
        print(json.dumps({"report_markdown": msg, "revised_code": None}))
        return 2

if __name__ == "__main__":
    sys.exit(main())
