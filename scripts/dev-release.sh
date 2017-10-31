# this script is supposed to run from ci
set -e

branch="$(git rev-parse --abbrev-ref HEAD)"
echo branch $branch
if [ $branch == "dev" ]; then
    echo "releasing dev version"
    ./node_modules/.bin/standard-version -m "chore(dev-release): %s [skip ci]"
    git push --follow-tags origin master
fi
