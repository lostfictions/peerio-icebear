# this script is supposed to run from ci only
set -e

    VERSION="$(node ./.circleci/get-package-version.js)"
    ./.circleci/ok.sh create_release PeerioTechnologies peerio-icebear v$VERSION
