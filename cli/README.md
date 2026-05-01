# warpfix

AI-powered CI repair from your terminal. Diagnose failures, fix tests, resolve dependencies — all from the command line.

## Install

```bash
npm install -g warpfix
```

Or run without installing:

```bash
npx warpfix doctor
```

## Setup

1. Go to [warpfix.org/dashboard/settings](https://warpfix.org/dashboard/settings) and generate a CLI API key
2. Run `warpfix login <your-api-key>`

## Commands

| Command | Description |
|---------|-------------|
| `warpfix doctor` | Diagnose your repo: health check, last repair, alerts |
| `warpfix fix-ci` | Detect and fix the latest CI failure |
| `warpfix fix-tests` | Fix failing tests |
| `warpfix fix-deps` | Resolve dependency conflicts |
| `warpfix fix-runtime` | Fix runtime errors |
| `warpfix predict-failure` | Predict which CI steps might fail next |
| `warpfix status <job-id>` | Check the status of a repair job |
| `warpfix login <api-key>` | Save your API key locally |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `WARPFIX_API_KEY` | API key (alternative to `warpfix login`) |
| `WARPFIX_API_URL` | API endpoint (default: `https://api.warpfix.org`) |

## Example

```bash
$ warpfix doctor

WarpFix Doctor
──────────────────────────────────────────────────
Repo:     git@github.com:myorg/myapp.git
Branch:   main
Language: node
Package:  pnpm
Runtime:  v20.11.0

API:      healthy (DB: ok, Redis: ok)

Last Repair
──────────────────────────────────────────────────
  Status:      completed
  Error:       type_error
  Confidence:  65/100
  PR:          https://github.com/myorg/myapp/pull/42

Run warpfix fix-ci to repair the latest CI failure.
```

## License

MIT
