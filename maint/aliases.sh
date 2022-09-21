##
## aliases - i like to zip around to different directories
##

# put this in your ~/.profile
### export SQUISH_ROOT=/opt/dvl/squishyElectron/squishy_electron_4
# or whatever path. Your .bash_profile, .bash_login, or .profile (different for
# other shells!) files only source (run) when you login, so you put exports in
# there, and lower shells will inherit them. The different files OVERRIDE each
# other! so if you already have one of these files, use that one.

# put this in your ~/.bashrc:
### source $SQUISH_ROOT/maint/aliases.sh
# Your .bashrc (or other if a different shell) runs for each invocation of bash,
# so put aliases in there, as they're not inherited by sub shells

# drat this runs before .profile, so this is annoying
#if [ -z "$SQUISH_ROOT" ]
#then echo " 🤢 SQUISH_ROOT is not defined: '$SQUISH_ROOT'"
#fi


alias qq='cd $SQUISH_ROOT'

alias qqa='cd $SQUISH_ROOT/articles'

alias qqq='cd $SQUISH_ROOT/quantumEngine'
alias qqqb='cd $SQUISH_ROOT/quantumEngine/building'
alias qqqf='cd $SQUISH_ROOT/quantumEngine/fourier'
alias qqqs='cd $SQUISH_ROOT/quantumEngine/schrodinger'
alias qqqw='cd $SQUISH_ROOT/quantumEngine/spaceWave'
alias qqqt='cd $SQUISH_ROOT/quantumEngine/testing'

alias qqn='cd $SQUISH_ROOT/node_modules'
alias qqp='cd $SQUISH_ROOT/public'

alias qqs='cd $SQUISH_ROOT/src'
alias qqsc='cd $SQUISH_ROOT/src/controlPanel'
alias qqse='cd $SQUISH_ROOT/src/engine'
alias qqsu='cd $SQUISH_ROOT/src/utils'
alias qqsv='cd $SQUISH_ROOT/src/view'
alias qqsw='cd $SQUISH_ROOT/src/wave'
