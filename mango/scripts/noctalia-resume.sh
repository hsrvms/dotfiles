#!/bin/sh
# Restart the noctalia shell daemon when the system resumes from suspend.
#
# The bar's workspace widget can freeze after a suspend/resume cycle. A full
# restart of the noctalia daemon (which owns the bar) reliably unfreezes it.
# This script listens on logind's PrepareForSleep D-Bus signal from the system
# bus and restarts noctalia when the "resumed" (false) signal arrives.
#
# Started from mango autostart with exec_once.

dbus-monitor --system \
  "type='signal',interface='org.freedesktop.login1.Manager',member='PrepareForSleep'" |
while IFS= read -r line; do
  case "$line" in
    *member=PrepareForSleep*)
      # Next line carries the boolean payload: true = sleeping, false = resumed
      IFS= read -r argline
      case "$argline" in
        *false*)
          pkill -x noctalia
          sleep 1
          noctalia -d >/dev/null 2>&1 &
          ;;
      esac
      ;;
  esac
done