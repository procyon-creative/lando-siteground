# TODO

## High Priority

- [x] Fix DB pull table prefix mismatch — `wp db reset --yes` before import in pull wrapper
- [x] Add `--env` runtime override to pull/push (e.g., `lando pull -d --env staging`)
- [x] Make procyon-cli a real dependency (git URL in package.json)
- [x] Remove dead code: `lib/tooling/pull.js`, `lib/tooling/push.js`, `scripts/sg-pull.sh`, `scripts/sg-push.sh`

## Medium Priority

- [ ] Add `--code` support — procyon `files pull` handles themes/plugins/uploads but not full webroot rsync
- [ ] Add README with .lando.yml configuration docs

## Low Priority

- [ ] Investigate using procyon's `--dry-run` mode for preview before pull/push
- [ ] Add `lando pull --all` / `lando push --all` shortcuts
