# TODO: Set Up Linting & Formatting

## When to do this
At a clean stopping point — not during active feature work or before a deploy.

## Frontend (packages/frontend)
- [ ] Install ESLint + `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- [ ] Install Prettier + `eslint-config-prettier`
- [ ] Create `eslint.config.js` (flat config)
- [ ] Create `.prettierrc`
- [ ] Add scripts: `"lint": "eslint src"`, `"format": "prettier --write src"`

## Backend (packages/backend)
- [ ] Install Ruff (`pip install ruff`)
- [ ] Create `ruff.toml` with line-length=100, Python 3.11 target
- [ ] Add scripts or Makefile: `ruff check .`, `ruff format .`

## After setup
1. Run `prettier --write .` and `ruff format .` to format the entire codebase
2. Commit as `chore: format entire codebase`
3. Create `.git-blame-ignore-revs` with that commit hash
4. Run `git config blame.ignoreRevsFile .git-blame-ignore-revs`
5. All future code stays clean automatically
