# this script is supposed to run from ci only
set -e

branch="$(git rev-parse --abbrev-ref HEAD)"
git config user.email "anri82@gmail.com"
git config user.name "Anri Asaturov"
echo branch $branch
if [ $branch == "dev" ]; then
    echo "releasing dev version"
    ./node_modules/.bin/standard-version -m "chore(dev-release): %s [skip ci]"
    git push --follow-tags origin dev
fi
