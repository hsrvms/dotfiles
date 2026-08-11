# Migrating from Noctalia v4 (Quickshell) to v5 (C++)

> Applies to your machine: **mango** Wayland compositor, Arch-based (CachyOS repos).
> Verified against the official v5 docs (docs.noctalia.dev).

## What you have now (v4)

| Package | Version | Purpose |
|---|---|---|
| `noctalia-qs` | 0.0.12-1.1 | Custom Quickshell fork (runtime) |
| `noctalia-shell` | 4.7.7-3 | The v4 shell itself |

- v4 is launched from `~/.config/mango/modules/autostart.conf`:
  `exec-once=qs -c noctalia-shell`
- v4 keybinds live in `~/.config/mango/modules/binds.conf` (all `qs -c noctalia-shell ipc call ...`).
- v4 config: `~/.config/noctalia/` (JSON files), cache `~/.cache/noctalia` + `~/.cache/noctalia-qs`.

## What v5 is

- **Noctalia v5** is a ground-up rewrite in **C++ / OpenGL ES**. It is a **fresh install**, not an upgrade.
- Package: `noctalia` (available from your CachyOS repos, `5.0.0_beta.7-1`).
- Binary: `noctalia`. IPC: `noctalia msg <command>`.
- Config: **TOML** in `~/.config/noctalia/`; state in `~/.local/state/noctalia/settings.toml`.
- **v4 settings are NOT migrated.** You will redo appearance/settings in the v5 GUI.
- The two do **not conflict** and can coexist. v4 uses `.json`, v5 uses `.toml` — different file names/extensions.

---

## The plan (safe order)

1. Swap to the stable `mangowm` release (replaces the `mangowm-git` build).
2. Reboot and verify mango still works.
3. Install v5 (alongside v4).
4. Switch autostart + keybinds to v5.
5. Test v5.
6. Only once v5 works: remove v4.
7. Clean up v4 leftovers.
8. Commit changes to the dotfiles repo.

## Checklist (track progress here)

- [x] Snapshot taken: `before mangowm update`
- [x] Decided to use stable `mangowm` (CachyOS) instead of updating `mangowm-git`
- [x] **Step A1:** Swap `mangowm-git` → stable `mangowm` (`sudo pacman -S mangowm`)
    - Note: v4 launcher broken by mango IPC change (`mmsg -s -d` → `mmsg dispatch spawn_shell,...`).
    - Decision: proceed to v5 (Option A) rather than patching v4.
- [x] **Step A2:** Snapshot taken: `before noctalia v5 install`
- [x] **Step A3:** Install Noctalia v5 (`sudo pacman -S noctalia`) — v5.0.0_beta.8
- [x] **Step A4:** Switch autostart to `noctalia` in mango autostart.conf
- [x] **Step A5:** Rewrite keybinds in mango binds.conf (v4 → v5) — verified working
- [x] **Step A6 (partial):** v5 running + IPC responsive (`noctalia` PID 4073, bar visible, `qs` stopped)
- [ ] **Step A6b:** Rebuild appearance in v5 Settings GUI (v4 settings not migrated)
- [x] **Step A7:** Remove v4 packages (`noctalia-shell`, `noctalia-qs`)
- [x] **Step A8:** Clean up v4 leftovers (cache, config → `~/noctalia-v4-backup/`, `qt6-wayland`/`scenefx0.4`/`wlroots0.19`)
- [ ] **Step A9:** Commit changes to dotfiles repo

---

## Step A1 — Swap to stable `mangowm` (replaces `mangowm-git`)

> `mangowm-git` and stable `mangowm` are built from the **same repo** (`mangowm/mango`);
> stable is a tagged release vs. the git HEAD build you have. Config format, keybinds,
> and the `/usr/bin/mango` binary are all identical, so no migration is needed.
> The swap pulls `wlroots 0.20` + `scenefx 0.5` (both already installed).

```bash
# Backup config before touching anything
cp ~/.config/mango/modules/autostart.conf ~/autostart.conf.bak
cp ~/.config/mango/modules/binds.conf ~/binds.conf.bak
cp ~/.config/mango/config.conf ~/mango-config.conf.bak

# Swap mangowm-git -> stable (will remove mangowm-git automatically)
sudo pacman -S mangowm

# Verify the binary is still present and which package owns it
which mango
pacman -Qo /usr/bin/mango
```

Then **reboot** and confirm mango still works before moving to Noctalia.

## Step A2 — Snapshot before the Noctalia install

Now that mango is stable, take a fresh snapshot before the package install:

```bash
sudo snapper -c root create -d "before noctalia v5 install"
sudo snapper -c root list
```

## Step A3 — Install Noctalia v5 (does NOT remove v4)

```bash
sudo pacman -S noctalia
```

> Use `sudo pacman -S noctalia`, **not** `sudo pacman -Syu` — the targeted install only
> touches `noctalia` + 3 support libs (`libqalculate`, `sdbus-cpp`, `tomlplusplus`),
> leaving mango and all other packages untouched.

Verify it's installed and get the full IPC list:

```bash
noctalia --version
noctalia msg --help
```

## Step A4 — Switch autostart from v4 to v5

Edit `~/.config/mango/modules/autostart.conf`. Change the launch line:

```ini
# before
exec-once=qs -c noctalia-shell
```

```ini
# after
exec-once=noctalia
```

> If mango expects the startup command to return immediately, use `exec-once=noctalia --daemon`.

## Step A5 — Update compositor keybinds

Edit `~/.config/mango/modules/binds.conf`. Replace every `qs -c noctalia-shell ipc call X` with `noctalia msg <v5-command>`.

Use this mapping for your current binds:

| v4 command | v5 command (`noctalia msg ...`) |
|---|---|
| `controlCenter toggle` | `panel-toggle control-center` |
| `settings toggle` | `settings-toggle` |
| `wallpaper toggle` | `panel-toggle wallpaper` |
| `wallpaper random` | `wallpaper-random` |
| `launcher toggle` | `panel-toggle launcher` |
| `launcher clipboard` | `panel-toggle clipboard` |
| `sessionMenu toggle` | `panel-toggle session` |
| `sessionMenu lockAndSuspend` | `session lock-and-suspend` |
| `lockScreen lock` | `session lock` |
| `idleInhibitor toggle` | `caffeine-toggle` |
| `bar toggle` | `bar-toggle` |
| `bar peek` | `bar-toggle` (approx.) |
| `volume increase` | `volume-up` |
| `volume decrease` | `volume-down` |
| `volume muteOutput` | `volume-mute` |
| `volume muteInput` | `mic-mute` |
| `brightness increase` | `brightness-up` |
| `brightness decrease` | `brightness-down` |

**Not directly mapped in v5 beta** (verify with `noctalia msg --help`):
- `launcher emoji` / `launcher command` → v5's launcher is a single panel; emoji/command may not have separate triggers yet.
- `systemMonitor toggle` → no v5 equivalent found; check the Control Center instead.
- `notifications toggleHistory` → v5 uses `notification-clear-active` / history in Control Center; no direct history toggle listed.

For any command you're unsure about: `noctalia msg --help` lists everything.

## Step A6 — Test v5

1. Reconfigure the session (or restart the compositor / log out and back in).
2. Confirm v5 is running: `pgrep -a noctalia` should show the `noctalia` binary (not `qs`).
3. Test the bar, launcher (SUPER+space), control center (SUPER+s), media keys.
4. Rebuild your theme/appearance in the v5 Settings GUI (v4 settings are not migrated). Mango's Noctalia theme file `~/.config/mango/noctalia.conf` is generated by v4 — v5 will regenerate its own.

> Keep v4 installed until you're happy with v5. They don't conflict.

## Step A7 — Remove v4 (ONLY after v5 works)

```bash
# Remove the v4 packages (q is safe here because nothing else depends on the shell)
sudo pacman -R noctalia-shell
sudo pacman -R noctalia-qs
```

If you ever want the old config back, you already have the tarball backups (below).

## Step A8 — Clean up v4 leftovers (optional)

```bash
# v4 config + caches you no longer need
rm -rf ~/.cache/noctalia-qs

# Keep ~/.config/noctalia (v5 uses this same dir for its TOML).
# If you want a clean v5 slate, move the old v4 JSON config aside first:
mkdir -p ~/noctalia-v4-backup
mv ~/.config/noctalia/*.json ~/.config/noctalia/plugins* ~/noctalia-v4-backup/ 2>/dev/null
```

> Do **not** delete `~/.config/noctalia` wholesale — v5 uses that directory (with `.toml` files). Only remove v4-specific `.json` files.

---

## Rollback (if v5 breaks)

```bash
# Reinstall v4, restore backups, and switch autostart back
sudo pacman -S noctalia-shell
cp ~/autostart.conf.bak ~/.config/mango/modules/autostart.conf
# (restore binds.conf.bak too, and revert the exec-once line to qs)
```

---

## Step A9 — Commit changes to dotfiles

Once everything works, commit the guide and any config changes to the dotfiles repo:

```bash
cd ~/dotfiles
git status
git add NOCTALIA-V5-MIGRATION.md
# add any updated mango config files here too (e.g. autostart.conf, binds.conf)
git commit -m "docs: add Noctalia v5 migration guide; update mango config"
```

> Do not push automatically — review the diff first.

---

## Key facts summary

- **v5 is a fresh install, not an upgrade** — plan to reconfigure appearance.
- **Don't delete `~/.config/noctalia`** — shared with v5 (TOML) alongside v4 (JSON).
- The only files you *must* change are in **mango**: `autostart.conf` (launch) and `binds.conf` (keybinds).
- Both versions can coexist, so you can roll back safely.