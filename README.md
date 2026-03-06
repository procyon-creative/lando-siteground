# Lando SiteGround

A [Lando](https://lando.dev) plugin that adds a `siteground` recipe for WordPress sites hosted on [SiteGround](https://www.siteground.com). Extends the built-in WordPress recipe with push/pull tooling powered by [procyon-cli](https://github.com/nicolasgalvez/procyon-cli).

## Installation

```bash
git clone https://github.com/your-org/lando-siteground.git ~/.lando/plugins/lando-siteground
cd ~/.lando/plugins/lando-siteground
npm install
```

## Configuration

```yaml
name: my-site
recipe: siteground
config:
  php: '8.3'
  webroot: .
  env: mysite.com
  host: ssh.example.sg-host.com
  user: u1234-abcdefg
  key: my-ssh-key
```

| Option | Description |
|--------|-------------|
| `env` | Environment name (directory under `/home/<user>/www/`) |
| `host` | SSH hostname |
| `user` | SSH username |
| `key` | SSH key filename from `~/.ssh/` (recommended — avoids "too many auth failures") |
| `port` | SSH port (default: `18765`) |
| `domain` | Remote domain for search-replace (defaults to `env` value) |

### Multiple Environments

Define additional environments via `connection` overrides (typically in `.lando.local.yml`):

```yaml
config:
  connection:
    staging.mysite.com:
      path: /home/u1234/www/staging.mysite.com/public_html
      domain: staging.mysite.com
```

## Usage

### Pull

```bash
lando pull -d          # Pull database
lando pull -f          # Pull files (uploads)
lando pull -d -f       # Pull both
lando pull             # Pull everything (default)
lando pull -d --env staging.mysite.com  # Target a specific environment
```

Database pulls automatically reset local tables before import (to handle prefix mismatches) and run search-replace for domain rewriting.

### Push

```bash
lando push -d          # Push database
lando push -f          # Push files (uploads)
lando push -d --env staging.mysite.com
```

Push requires at least one explicit flag — no default "push everything" for safety.

### Environment Discovery

```bash
lando sg:env:list      # SSH to server and list available environments
lando sg:env:set       # Show instructions for switching environments
```

### Direct Procyon Access

For advanced operations:

```bash
lando procyon files pull mysite.com themes
lando procyon files pull mysite.com plugins --name my-plugin
lando procyon files push mysite.com uploads --dry-run
lando procyon db pull mysite.com
```

## How It Works

1. Extends Lando's WordPress recipe (PHP, Apache, MySQL, wp-cli)
2. Installs Node.js in the appserver container
3. Mounts [procyon-cli](https://github.com/nicolasgalvez/procyon-cli) and auto-generates config from `.lando.yml`
4. SSH from the container to SiteGround on port 18765

## SiteGround SSH

SiteGround provides SSH on **port 18765**. You need:

1. SSH access enabled in SiteGround Site Tools > Devs > SSH Keys Manager
2. Your SSH hostname (e.g., `ssh.example.sg-host.com`)
3. Your SSH username
4. Environments are subdirectories of `/home/<user>/www/`, with WordPress at `public_html/`

## Development

```bash
npm test              # Unit + e2e tests (mocha)
npx playwright test   # Browser tests (requires lando start)
```

## License

GPL-3.0-or-later
