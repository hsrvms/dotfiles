source /usr/share/cachyos-fish-config/cachyos-config.fish

# Disable the CachyOS automatic fastfetch greeting.
function fish_greeting
end

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

# SSH tunnel to Sage production Postgres (25432) - container IP on sage_default
alias sage-tunnel 'ssh -N -L 25432:172.19.0.2:5432 agentsfer-contabo-server'

# bun
set --export BUN_INSTALL "$HOME/.bun"
set --export PATH $BUN_INSTALL/bin $PATH
set -gx MOZ_ENABLE_WAYLAND 1


if test -f ~/.config/fish/secrets.fish
      source ~/.config/fish/secrets.fish
  end

function foot_notify_long_process --on-event fish_postexec
    # $CMD_DURATION is automatically set by Fish in milliseconds.
    # 5000 = 5 seconds. Adjust this threshold as desired.
    if test $CMD_DURATION -gt 5000
        # Convert milliseconds to seconds for a cleaner notification
        set -l secs (math -s 1 "$CMD_DURATION / 1000")

        # Send OSC 777 escape sequence directly to foot
        printf "\e]777;notify;Command Finished;Took %ss: %s\e\\" $secs $argv
    end
end
