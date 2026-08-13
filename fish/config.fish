source /usr/share/cachyos-fish-config/cachyos-config.fish

# vi keybindings for the command line
fish_vi_key_bindings

# cursor shape per mode: block in Normal, line in Insert, block in Replace
set fish_cursor_default block
set fish_cursor_insert line
set fish_cursor_replace_one underscore
set fish_cursor_visual block

# starship prompt
starship init fish | source

# set -Ux EDITOR (which micro)

abbr -a fzfa "fzf --ansi"
abbr -a cs "gh cs"
abbr -a dc devcontainer
abbr -a gotest 'GOTEST_SKIPNOTESTS="true" gotest'

# alias zed zeditor

# SSH tunnel to Contabo for db (15432) + MinIO console (19001)
# Local ports are offset to avoid clashing with any local postgres on 5432.
alias omnix-tunnel 'ssh -N -L 15432:127.0.0.1:5432 -L 19001:127.0.0.1:9001 admin@100.100.251.101'

# bun
set --export BUN_INSTALL "$HOME/.bun"
set --export PATH $BUN_INSTALL/bin $PATH
set -gx MOZ_ENABLE_WAYLAND 1


if test -f ~/.config/fish/secrets.fish
      source ~/.config/fish/secrets.fish
  end
