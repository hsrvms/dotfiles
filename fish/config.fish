source /usr/share/cachyos-fish-config/cachyos-config.fish
# set -Ux EDITOR (which micro)

abbr -a fzfa "fzf --ansi"
abbr -a cs "gh cs"
abbr -a dc devcontainer
abbr -a gotest 'GOTEST_SKIPNOTESTS="true" gotest'

# alias zed zeditor

# bun
set --export BUN_INSTALL "$HOME/.bun"
set --export PATH $BUN_INSTALL/bin $PATH
