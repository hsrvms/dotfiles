# AGENTS.md

Dotfiles for a single-user Arch Linux (CachyOS) workstation, an MSI Prestige 14
laptop running the **mango** Wayland compositor with the **Noctalia v5** shell.
There is no source code, build system, or test suite here: every top-level
directory is the config directory for one application, and the repo is managed
purely through git. The user is `hsrvms`; commit history uses conventional
prefixes (`feat:`, `fix:`, `chore:`, `pi:`, `mango:`).

## Layout & deployment

Each top-level directory mirrors that app's `~/.config/<name>` and is deployed
by symlinking. On this machine `~/.config/<name> -> ~/dotfiles/<name>` already
exists for: btop, fastfetch, fish, foot, kmonad, mango, nix, noctalia, nvim,
paru, rofi, starship.toml, tridactyl, yazi, zed. `~/.tmux.conf` symlinks to
`tmux/tmux.conf`. `skills/` is the exception to the one-app-per-directory
rule: shared SKILL.md bundles, deployed by symlinking
`~/.agents/skills -> ~/dotfiles/skills` (read by pi, reasonix, and codewhale).
`~/.reasonix` symlinks to `.reasonix/` (reasonix config; its `.env`, `logs/`,
`projects/`, and telemetry files are gitignored — see `.reasonix/.gitignore`).
`cliphist` has no `~/.config/cliphist` symlink — it is not
actively used by autostart.

**Gotchas:**

- `install.sh` is **stale**. It still creates symlinks for directories that no
  longer exist in the repo (hypr, kitty, swaync, waybar, wlogout,
  warp-terminal, sddm.conf.d, xorg.conf.d) and does not include newer dirs
  (mango, noctalia, nvim, foot, paru, tridactyl, nix, starship). Do not treat
  it as an authoritative list of what is deployed; the current symlinks in
  `~/.config` are authoritative. It also installs packages (yay, kmonad udev
  rules, input group) and would take destructive actions on a fresh box
  (`usermod`, `modprobe`, `systemctl` are used inside it).
- Two symlinks on the machine are currently **broken**: `~/.config/kanshi` and
  `~/.config/qutebrowser` point at `~/dotfiles/kanshi` and
  `~/dotfiles/qutebrowser/`, which do not exist in the repo. If a config is
  missing from the repo and an app is being configured, this is why.
- Paths inside configs are frequently hardcoded with the username
  (`/home/hsrvms/...`) — e.g. `mango/config.conf` sources the theme from
  `/home/hsrvms/.config/mango/noctalia.conf`. These are machine-specific and
  not portable.

## Compositor: mango + Noctalia

- **mango** (mangowm, a Hyprland-family Wayland compositor). `mango/config.conf`
  is the entry point; it `source=`-includes everything from `mango/modules/`
  (environment, autostart, monitor, input, binds, animation, decoration,
  layout, overview, miscellaneous, windowrule), plus the generated theme file
  `mango/noctalia.conf`.
- `mango/noctalia.conf` is **generated automatically by the Noctalia shell**,
  not hand-edited. Editing it by hand is pointless — the shell overwrites it.
- **Noctalia v5** is the shell (bar, launcher, control center). It was
  migrated from v4 (Quickshell, `qs -c noctalia-shell`) to v5 (C++,
  `noctalia`); see `NOCTALIA-V5-MIGRATION.md` for the full mapping. All IPC
  goes through `noctalia msg <command>` (e.g. `noctalia msg panel-toggle
  launcher`). To find available commands run `noctalia msg --help`; several v4
  commands have no v5 equivalent yet (noted as comments in binds.conf).
- Autostart (`mango/modules/autostart.conf`) launches `noctalia`, kmonad,
  `wlr-randr --output eDP-1 --custom-mode 2560x1600@60` (fixed laptop
  resolution), easyeffects, xdg-desktop-portal, and a boot terminal.
- `mango/scripts/` holds small shell scripts used by keybinds
  (screenshot via grim+slurp+satty, noctalia-resume, togglefloat).
- `noctalia/bar-hide-laptop.conf` hides the bar on the internal eDP-1 screen
  when docked; noctalia v5 config lives in `~/.config/noctalia/*.toml`.

## Machine-specific values (do not "fix" them)

- Keyboard layout: `us,tr` with `grp:lalt_lshift_toggle` (see
  `mango/modules/input.conf`).
- kmonad (`kmonad/config.kbd`) binds to a **hardcoded device**
  `/dev/input/event3` (the internal laptop keyboard on this machine) and
  implements home-row mods via `tap-hold-next-release` (a=Super, s=Alt,
  d=Ctrl, f=Shift; space hold = nav layer). Requires the `kmonad-static`
  package and the udev/input-group setup from install.sh; keys are named from
  `wev`/`xev` output.
- btop, fastfetch (ascii logos in `fastfetch/`, using IosevkaTerm Nerd Font
  glyphs), and rofi palettes are all tuned to this machine's theme
  (dark, mostly Catppuccin-mocha-flavored colors).

## Shell & editors

- **fish**: `config.fish` sources `/usr/share/cachyos-fish-config/...`
  (CachyOS-specific), enables vi keybindings with per-mode cursor shapes, and
  sources `fish/secrets.fish` if present. `secrets.fish` is gitignored — keep
  it out of commits. `EDITOR` is `zed` (set in mango environment.conf).
- **nvim**: NvChad v2.5 plugin-style config (`NvChad/NvChad` is loaded as a
  plugin). Theme set in `lua/chadrc.lua` (onedark). Plugins are declared in
  `lua/plugins/init.lua`; LSP servers configured in `lua/configs/lspconfig.lua`
  (only `html` + `cssls`). Lua formatting via stylua (`.stylua.toml`,
  conform.nvim). `lazy-lock.json` pins plugin versions — update it when
  changing plugins.
- **helix**: notable custom keys — `C-g` spawns lazygit in a scratch buffer,
  `C-e` opens yazi as a file picker (writes choice to `/tmp/unique-file`),
  `space f` / `space F` file pickers, `C-s` saves. `languages.toml` enables
  gopls, templ, TS language servers with auto-format.
- **zed**: `settings.json` has per-language LSP config (pyright+ruff for
  Python, gopls hints for Go) and machine-specific `ssh_connections`
  (`um870`) and a Tailscale ollama URL (`http://100.91.19.12:11434`) — keep
  those; they are intentional. JSONC with comments.
- **tmux**: `tmux/tmux.conf` is deliberately portable (works on remote
  servers, tmux 2.1+), prefix `Ctrl+b`, hjkl pane navigation, vi mode keys.
  `tmux/CHEATSHEET.md` is the user-facing reference.

## `.pi/` directory — Pi agent runtime state

`.pi/` is the config/state of **Pi**, a CLI AI agent, and it is tracked in git.
It is not app config:

- `settings.json`: provider/model preferences (deepseek), approval mode, TUI
  mode. This file and `models-store.json` are frequently modified by the
  running agent; do not churn them.
- `extensions/` (TypeScript: command-gate, deepseek-usage, image-fallback) is
  real code with tests (`.test.mjs` files, run with node) — the only tests in
  this repo. Skills no longer live under `.pi/`: they live in the top-level
  `skills/` directory, shared with other agents through the
  `~/.agents/skills` symlink (see Layout & deployment).
- `get-secret.sh` reads keys from `~/.pi/agent/.env`; that file, `auth.json`,
  `sessions/`, `missions/`, `run-history.jsonl`, and `node_modules/` are
  ignored via `.pi/agent/.gitignore`. Never commit `.env` or `auth.json`.
- `.pi/agent/AGENTS.md` is Pi's *global* engineering-rules file (generic
  guidance for code projects), not repo-specific. This file is the
  repo-specific one.

## Workflow

- No build/test/lint commands exist for the config dirs. Verify changes by
  inspecting the config (`wev` for key names, `noctalia msg --help` for IPC,
  `wlr-randr` for monitors) or reloading the app (mango: `SUPER+r` reloads
  config; tmux: `bind r` in tmux reloads tmux.conf).
- When adding a new app's config: create the top-level dir, symlink it into
  `~/.config/<name>` manually (install.sh is stale — do not rely on it), and
  keep gitignore coverage for anything secret.
- Commit style: short conventional-ish prefixes, focused one-app commits
  (see `git log`).
