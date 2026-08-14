# tmux cheat sheet

Prefix is `Ctrl+b` (written as `P` below).

## Mental model

| Layer   | What it is                                   |
|---------|----------------------------------------------|
| server  | the tmux daemon (one per user, auto-started) |
| session | named workspace — **survives disconnect**    |
| window  | a "tab" inside a session                     |
| pane    | a split inside a window                      |

The point of tmux: a session outlives your SSH connection. Detach, reconnect, `attach`, done.

## Shell commands

| Command                         | What it does              |
|---------------------------------|---------------------------|
| `tmux`                          | new unnamed session       |
| `tmux new -s name`              | new named session         |
| `tmux a` / `tmux attach -t n`   | reattach                 |
| `tmux ls`                       | list sessions            |
| `tmux kill-session -t name`     | kill a session           |
| `tmux kill-server`              | kill everything          |

## Sessions & windows

| Keys      | Action                        |
|-----------|-------------------------------|
| `P d`     | detach (leave it running)     |
| `P $`     | rename session                |
| `P s`     | choose/switch session         |
| `P w`     | choose window (tree)          |
| `P c`     | new window (current dir)      |
| `P n` `P p` | next / previous window     |
| `P 0-9`   | jump to window N              |
| `P ,`     | rename window                 |
| `P &`     | kill window                   |
| `P Tab`   | last window                   |
| `P r`     | reload this config            |
| `P :`     | command prompt                |

## Panes

| Keys        | Action                          |
|-------------|---------------------------------|
| `P "` `P -` | split down (horizontal border)  |
| `P %` `P \|`| split right (vertical border)   |
| `P h j k l` | move focus (vi-style)           |
| `P o`       | next pane (rotate)              |
| `P z`       | zoom pane in/out                |
| `P Space`   | cycle layouts                   |
| `P x`       | kill pane                       |

## Copy mode (vi)

| Keys                    | Action                         |
|-------------------------|--------------------------------|
| `P [`                   | enter copy mode                |
| arrows / `h j k l`      | move around                    |
| `Space` (`v` in 3.2+)   | start selection                |
| `Enter` (`y` in 3.2+)   | copy selection                 |
| `/` `?`                 | search forward / backward      |
| `q`                     | quit copy mode                 |
| `P ]`                   | paste (outside copy mode)      |

## Nested tmux (local → ssh → tmux)

`P P` sends a literal prefix through to the inner tmux.
