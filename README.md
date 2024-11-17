# My dotfiles

This directory contains the dotfiles for my system

## Requirements

Ensure you have the following installed on your system

### Stow

```
sudo apt install stow
```

## Installation

First, fetch the dotfiles repo in your $HOME directory using git

```
$ git clone git@github.com/hsrvms/dotfiles.git
$ cd dotfiles
```

then use GNU stow to create symlinks

```
$ stow zed
```
