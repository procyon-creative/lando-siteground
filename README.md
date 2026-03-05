## Lando SiteGround

A Lando plugin that adds a `siteground` recipe with `pull` and `push` commands for WordPress sites hosted on SiteGround.

### Features

- **`siteground` recipe** extending the stock `wordpress` recipe
- **`lando pull`** with `-c/-d/-f` flags (code, database, files) via rsync + wp-cli over SSH
- **`lando push`** with `-c/-d/-f` flags to push code, database, and/or files
- **`lando sg:env:list`** discovers environments by SSHing into the server and listing `/home/<user>/www/`
- **`lando sg:env:set`** for instructions on switching environments
- Hook points via Lando events (`post-pull`, `post-push`)

### SiteGround SSH

SiteGround provides SSH access on **port 18765**. You'll need:

1. SSH access enabled in SiteGround Site Tools > Devs > SSH Keys Manager
2. Your SSH hostname (e.g., `your-server.siteground.biz`)
3. Your SSH username

### Environments

On SiteGround, each environment is a subdirectory under `/home/<user>/www/`. The plugin auto-derives the remote path as `/home/<user>/www/<env>` from your configured `user` and `env`.

Run `lando sg:env:list` to SSH into the server and discover all available environments.

### Configuration

```yaml
name: my-site
recipe: siteground
config:
  php: '8.3'
  webroot: .

  # The environment directory name under /home/<user>/www/
  env: mysite.com

  # SSH connection details
  host: your-server.siteground.biz
  user: your-ssh-username
```

The remote path is auto-derived as `/home/<user>/www/<env>`. You can override per-environment if needed:

```yaml
config:
  connection:
    staging.mysite.com:
      path: /some/custom/path
```

Put per-developer SSH overrides in `.lando.local.yml` (add to `.gitignore`).

### Usage

```bash
# Discover environments on the remote server
lando sg:env:list

# Pull everything from the configured environment
lando pull

# Pull only the database
lando pull -d

# Pull code and files
lando pull -c -f

# Push code
lando push -c

# Push database (requires explicit flag for safety)
lando push -d

# Push files
lando push -f
```

### Pull behavior

- **Code** (`-c`): rsync from remote, excluding uploads, cache, `.git`, `.lando.*`, and `wp-config.php`
- **Database** (`-d`): `wp db export` on remote via SSH, then `wp db import` locally
- **Files** (`-f`): rsync `wp-content/uploads/` from remote

### Push behavior

- **Code** (`-c`): rsync to remote with same exclusions as pull
- **Database** (`-d`): `wp db export` locally, then `wp db import` on remote via SSH
- **Files** (`-f`): rsync `wp-content/uploads/` to remote
- Push requires at least one explicit flag (no default "push everything" for safety)

### Installation

```bash
# From the plugin directory
lando plugin-add /path/to/lando-siteground
```

### Environment switching

Set the target environment via:
- `config.env` in `.lando.yml`
- `LANDO_SG_ENV` environment variable
- `lando sg:env:set` for instructions
