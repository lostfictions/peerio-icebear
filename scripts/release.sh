set -e
export NODE_ENV=production

branch="$(git rev-parse --abbrev-ref HEAD)"
if [ branch != "master" ]; then
    echo "---------------------------------------------------------------------------------------"
    echo "Can't release from $branch branch. Switch to master and merge latest release branch to it.";
    echo "---------------------------------------------------------------------------------------"
    exit;
fi

npm run validate

read -p "Did you merge to master everything that was needed? Confirm release? (y/n)" choice
case "$choice" in
  y|Y ) echo "yes";;
  n|N ) exit;;
  * ) exit;;
esac

echo "------------------------"
echo "1. Builing documentation"
echo "------------------------"

npm run doc:build
git add -A
git commit -a -m "docs: build"

echo "---------------------------"
echo "2. Running standard-version"
echo "---------------------------"

standard-version

read -p "All good? Push to git and publish to npm? (y/n)" choice
case "$choice" in
  y|Y ) echo "yes";;
  n|N ) exit;;
  * ) exit;;
esac

git push --follow-tags origin master && npm publish

echo '3. Opening peerio-icebear github, go edit release notes publish the release.'
echo '---------------------------------------------------------'
open https://github.com/PeerioTechnologies/peerio-icebear/releases
