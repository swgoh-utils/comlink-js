# Contributing

This project utilizes the [github flow](https://docs.github.com/en/get-started/quickstart/github-flow) and
commit log messages use [conventional commits](https://www.conventionalcommits.org/) formatting.
The main supported commit types are breaking, feat, and fix which correspond to semantic versioning
requirements.  The package is automatically published to NPM as part of the github actions using
[semantic-release](https://semantic-release.gitbook.io/semantic-release/) based on the commit types
contained on the branch since the last time it was published.  This performs the appropriate npm
version, creates the release tag, publishes, and pushes the artifacts to the git repo as well.