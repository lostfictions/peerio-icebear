set -e
export NODE_ENV=production


# offer to switch to master
branch="$(git rev-parse --abbrev-ref HEAD)"
if [ branch != "master" ]; then
    git status -uall
    read -p "Can't release from $branch branch. Switch to master? (y/n)" choice
    case "$choice" in
    y|Y ) echo "yes";;
    n|N ) exit;;
    * ) exit;;
    esac

    git checkout master
fi


read -p "Merge dev => master? (y/n)" choice
case "$choice" in
  y|Y ) git merge dev;;
  n|N ) exit;;
  * ) exit;;
esac

# check the state of the branch before anythig
npm run validate

# last confirmation before release build
read -p "All the changes needed are in master? No errors? Confirm release? (y/n)" choice
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

# last confirmation before release push
read -p "All good? Push to git and publish to npm? (y/n)" choice
case "$choice" in
  y|Y ) echo "yes";;
  n|N ) exit;;
  * ) exit;;
esac

git push --follow-tags origin master && npm publish

# no reason to stay in master
git checkout dev

# megre changes back to dev?
read -p "Merge master => dev? (y/n)" choice
case "$choice" in
  y|Y ) git merge master;;
  n|N ) ;;
  * ) ;;
esac

echo '3. Opening peerio-icebear github, go edit release notes publish the release.'
echo '---------------------------------------------------------'
open https://github.com/PeerioTechnologies/peerio-icebear/releases
