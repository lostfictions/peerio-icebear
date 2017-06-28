if [ "$(git rev-parse --abbrev-ref HEAD)" != "master" ]; then
    echo "---------------------------------------------------------------------------------------"
    echo "Can't release from $(git rev-parse --abbrev-ref HEAD) branch. Switch to master and merge latest release branch to it.";
    echo "---------------------------------------------------------------------------------------"
    exit;
fi

npm run validate

read -p "Confirm release? (y/n)" choice
case "$choice" in
  y|Y ) echo "yes";;
  n|N ) exit;;
  * ) exit;;
esac

echo "1. Builing documentation"
echo "------------------------"

npm run doc:build
git add -A

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

echo '3. Opening peerio-icebear github, go publish the release.'
echo '---------------------------------------------------------'
open https://github.com/PeerioTechnologies/peerio-icebear/releases
