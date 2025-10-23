##
## aliases - i like to zip around to different directories
##

# This is not mandatory - you may or may not like them or use them.

# To use these aliases, put this in your ~/.bashrc or ~/.*rc file:
#    source $SQUISH_ROOT/maint/aliases.sh
# You have to do 'source' or '.', you can't just run the file like a script.
# Your .bashrc (or other if a different shell) runs for each invocation of bash,
# so put aliases in there, as they're not inherited by sub shells like exported env vars.

# Your .bash_profile, .bash_login, or .profile (different for non-Bash shells!)
# file only sources (runs, sortof) when you login, so you put exports in there,
# and lower shells will inherit them. (Like if you run 'bash' to make a subshell.)
#  The different files OVERRIDE each other (at least for bash)! so, if you already
# have one of these files, edit that one.  But, if it sources .profile, it won't
# source .bashrc, so .profile should also source .bashrc at the end, ... AFTER you
# define everything.   like this:
#    export SQUISH_ROOT=/opt/dvl/squishyElectron/squishy_electron_4
#    source .bashrc

# how do you tell which shell you're using?  Run 'ps'.  You'll see a list of
# running programs you've started from your terminal (whether or not you know
# you did).  If you see some lines like these, you're running Bash:
#	 3500 ttys003    0:00.64 bash
#	 2217 ttys004    0:00.11 -bash
# If you see some other program that ends in 'sh', it's probably that one.  Some
# possible shells: bash csh dash ksh sh tcsh zsh
# To read way too much about your shell, and the details above, do a 'man tcsh'
# or 'man zsh' or whatever.

# The aliases.  Hopefully you don't have any other commands you're using that
# start with 'qq'.
alias qq='cd $SQUISH_ROOT'

alias qqa='cd $SQUISH_ROOT/articles'

alias qqq='cd $SQUISH_ROOT/quantumEngine'
alias qqqb='cd $SQUISH_ROOT/quantumEngine/building'
alias qqqd='cd $SQUISH_ROOT/quantumEngine/debroglie'
alias qqqf='cd $SQUISH_ROOT/quantumEngine/fourier'
alias qqqg='cd $SQUISH_ROOT/quantumEngine/greiman'
alias qqqh='cd $SQUISH_ROOT/quantumEngine/hilbert'
alias qqqs='cd $SQUISH_ROOT/quantumEngine/schrodinger'
alias qqqt='cd $SQUISH_ROOT/quantumEngine/testing'
alias qqqw='cd $SQUISH_ROOT/quantumEngine/wasm'

alias qqd='cd $SQUISH_ROOT/docGen'
alias qqdd='cd $SQUISH_ROOT/docGen/docSrc'

alias qqm='cd $SQUISH_ROOT/maint'
alias qqn='cd $SQUISH_ROOT/node_modules'
alias qqp='cd $SQUISH_ROOT/public'
alias qqpe='cd $SQUISH_ROOT/public/qEng'
alias qqpq='cd $SQUISH_ROOT/public/qEng'
alias qqpd='cd $SQUISH_ROOT/public/doc'

alias qqs='cd $SQUISH_ROOT/src'
alias qqsc='cd $SQUISH_ROOT/src/controlPanel'
alias qqse='cd $SQUISH_ROOT/src/engine'
alias qqsu='cd $SQUISH_ROOT/src/utils'
alias qqsg='cd $SQUISH_ROOT/src/gl'
alias qqsgc='cd $SQUISH_ROOT/src/gl/cx2rygb'
alias qqsgt='cd $SQUISH_ROOT/src/gl/tests'
alias qqss='cd $SQUISH_ROOT/src/sPanel'
alias qqsv='cd $SQUISH_ROOT/src/volts'
alias qqsw='cd $SQUISH_ROOT/src/widgets'
