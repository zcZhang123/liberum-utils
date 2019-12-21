#!/bin/bash
username=`npm whoami`
echo $username
if test "$username" = "jingchuang"; then
    if test "$1" = "";then
        npm version patch --no-git-tag-version
    else
        npm version $1 --no-git-tag-version
    fi
    if [ -d "lib" ];then
        rm -r lib
    fi
    npm run build
    npm publish
else
    echo "please login with jingchuang account"
    exit 0
fi