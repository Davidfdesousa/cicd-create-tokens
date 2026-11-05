/**
 * semantic-release
 *
 * Version is derived from Conventional Commits on the release branches:
 *   fix: → patch · feat: → minor · feat!: / BREAKING CHANGE: → major
 *
 * `main` publishes stable releases, which are distributed to the consumer
 * repositories (CDN, Android, iOS). `rc` publishes prereleases tagged
 * `-rc.N` that are not distributed automatically; a consumer can still pull
 * one on demand through its "Sync design tokens" workflow.
 *
 * Each release builds the platform files with the version being published,
 * zips them per platform and attaches the zips to the GitHub Release. The
 * consumers download those assets, so the release is the single source of truth.
 */
const config = {
  branches: ['main', { name: 'rc', prerelease: true }],
  plugins: [
    ['@semantic-release/commit-analyzer', { preset: 'conventionalcommits' }],
    ['@semantic-release/release-notes-generator', { preset: 'conventionalcommits' }],
    ['@semantic-release/changelog', { changelogFile: 'CHANGELOG.md' }],
    ['@semantic-release/npm', { npmPublish: false }],
    [
      '@semantic-release/exec',
      {
        prepareCmd: 'npm run tokens:build -- --version ${nextRelease.version} && npm run tokens:pack',
        // Exposes the published version to the next jobs of the workflow.
        successCmd:
          'echo "version=${nextRelease.version}" >> "$GITHUB_OUTPUT" && echo "channel=${nextRelease.channel || \'latest\'}" >> "$GITHUB_OUTPUT"',
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'package-lock.json'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
    [
      '@semantic-release/github',
      {
        assets: [
          { path: 'dist/tokens/tokens-web.zip', label: 'Web (CSS + JSON)' },
          { path: 'dist/tokens/tokens-android.zip', label: 'Android (colors.xml)' },
          { path: 'dist/tokens/tokens-ios.zip', label: 'iOS (DesignTokens.swift)' },
        ],
      },
    ],
  ],
};

export default config;
