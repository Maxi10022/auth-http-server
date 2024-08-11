[![GitHub Workflow Status (master)](https://img.shields.io/github/workflow/status/http-party/http-server/Node.js%20CI/master?style=flat-square)](https://github.com/http-party/http-server/actions)
[![npm](https://img.shields.io/npm/v/http-server.svg?style=flat-square)](https://www.npmjs.com/package/http-server) [![homebrew](https://img.shields.io/homebrew/v/http-server?style=flat-square)](https://formulae.brew.sh/formula/http-server) [![npm downloads](https://img.shields.io/npm/dm/http-server?color=blue&label=npm%20downloads&style=flat-square)](https://www.npmjs.com/package/http-server)
[![license](https://img.shields.io/github/license/http-party/http-server.svg?style=flat-square)](https://github.com/http-party/http-server)

# auth-http-server: a simple static HTTP server with authentication

`auth-http-server` is a fork of [http-server](https://github.com/http-party/http-server).
This fork is a simple, command-line static HTTP server, with a [supabase](https://supabase.com/)-based authentication extension.  

As the original, it is powerful enough for production usage, but it's simple and hackable enough to be used for testing, local development and learning.

## Supabase Setup

`auth-http-server` supports role based access to the server. 
For this to work, the [included PosgreSQL database](https://supabase.com/docs/guides/database/overview) needs the tables `user_roles` and `roles`.

The default role is called `docs_reader`, which the server validates by default if not specified otherwise. 


> Roles which should be checked can be specified like so: `--roles 'docs_reader, docs_writer'`.
> <br>**Note: Only one of the specified roles must match for the user to be allowed to access.** 

Execute this setup script to setup the tables with [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) enabled and the required policies: 

<details>
<summary>Show PostgreSQL setup-script</summary>

    create table if not exists roles
    (
        id             uuid                     default gen_random_uuid()                not null
        primary key,
        created_at_utc timestamp with time zone default (now() AT TIME ZONE 'utc'::text) not null,
        name           text                                                              not null
        unique,
        description    text
    );

    alter table roles
    owner to postgres;

    grant delete, insert, references, select, trigger, truncate, update on roles to anon;

    grant delete, insert, references, select, trigger, truncate, update on roles to authenticated;

    grant delete, insert, references, select, trigger, truncate, update on roles to service_role;

    ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

    INSERT INTO public.roles (name, description) VALUES ('docs_reader', 'The user has read access to all documentations with authentication based on this Supabase project.');

    create table if not exists user_roles
    (
        user_id        uuid                                                              not null
        references auth.users
        on update restrict on delete cascade,
        role_id        uuid                     default gen_random_uuid()                not null
        references roles
        on update restrict on delete cascade,
        granted_at_utc timestamp with time zone default (now() AT TIME ZONE 'utc'::text) not null,
        primary key (user_id, role_id)
    );

    alter table user_roles
    owner to postgres;

    grant delete, insert, references, select, trigger, truncate, update on user_roles to anon;

    grant delete, insert, references, select, trigger, truncate, update on user_roles to authenticated;

    grant delete, insert, references, select, trigger, truncate, update on user_roles to service_role;

    ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

    create policy user_can_select_own_grants on user_roles
    as permissive
    for select
    to authenticated
    using ((SELECT auth.uid() AS uid) = user_id);

    create policy user_can_select_granted_roles on roles
    as permissive
    for select
    to authenticated
    using (EXISTS (SELECT 1
    FROM user_roles
    WHERE ((user_roles.role_id = roles.id) AND (user_roles.user_id = auth.uid()))));
   
</details>

## Installation:

#### Running on-demand:

Using `npx` you can run the script without installing it first:

    npx auth-http-server [path] --supabaseUrl [url] --supabaseKey [anonKey] [options] 

#### Globally via `npm`

    npm install --global auth-http-server

This will install `auth-http-server` globally so that it may be run from the command line anywhere.

#### Globally via Homebrew

    brew install auth-http-server
     
#### As a dependency in your `npm` package:

    npm install auth-http-server

## Usage:

     auth-http-server [path] --supabaseUrl [url] --supabaseKey [anonKey] [options] 

`[path]` defaults to `./public` if the folder exists, and `./` otherwise.

*Now you can visit http://localhost:8080 to view your server*

**Note:** Caching is on by default. Add `-c-1` as an option to disable caching.

## Available Options:

| Command                  | 	Description                                                                                                                                                                                                                                     | Defaults          |
|--------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------|
| `-p` or `--port`         | Port to use. Use `-p 0` to look for an open port, starting at 8080. It will also read from `process.env.PORT`.                                                                                                                                   | 8080              |
| `-a`                     | Address to use                                                                                                                                                                                                                                   | 0.0.0.0           |
| `-d`                     | Show directory listings                                                                                                                                                                                                                          | `true`            |
| `-i`                     | Display autoIndex                                                                                                                                                                                                                                | `true`            |
| `-g` or `--gzip`         | When enabled it will serve `./public/some-file.js.gz` in place of `./public/some-file.js` when a gzipped version of the file exists and the request accepts gzip encoding. If brotli is also enabled, it will try to serve brotli first.         | `false`           |
| `-b` or `--brotli`       | When enabled it will serve `./public/some-file.js.br` in place of `./public/some-file.js` when a brotli compressed version of the file exists and the request accepts `br` encoding. If gzip is also enabled, it will try to serve brotli first. | `false`           |
| `-e` or `--ext`          | Default file extension if none supplied                                                                                                                                                                                                          | `html`            | 
| `-s` or `--silent`       | Suppress log messages from output                                                                                                                                                                                                                |                   |
| `--cors`                 | Enable CORS via the `Access-Control-Allow-Origin` header                                                                                                                                                                                         |                   |
| `-o [path]`              | Open browser window after starting the server. Optionally provide a URL path to open. e.g.: -o /other/dir/                                                                                                                                       |                   |
| `-c`                     | Set cache time (in seconds) for cache-control max-age header, e.g. `-c10` for 10 seconds. To disable caching, use `-c-1`.                                                                                                                        | `3600`            |
| `-U` or `--utc`          | Use UTC time format in log messages.                                                                                                                                                                                                             |                   |
| `--log-ip`               | Enable logging of the client's IP address                                                                                                                                                                                                        | `false`           |
| `-P` or `--proxy`        | Proxies all requests which can't be resolved locally to the given url. e.g.: -P http://someurl.com                                                                                                                                               |                   |
| `--proxy-options`        | Pass proxy [options](https://github.com/http-party/node-http-proxy#options) using nested dotted objects. e.g.: --proxy-options.secure false                                                                                                      |
| `--supabaseUrl`          | The supabase project-url.                                                                                                                                                                                                                        |                   |
| `--supabaseKey`          | The supabase projects anon-key.                                                                                                                                                                                                                  
| `--roles`                | The allowed roles which can access the server.                                                                                                                                                                                                   | `[ docs_reader ]` |
| `-S`, `--tls` or `--ssl` | Enable secure request serving with TLS/SSL (HTTPS)                                                                                                                                                                                               | `false`           |
| `-C` or `--cert`         | Path to ssl cert file                                                                                                                                                                                                                            | `cert.pem`        | 
| `-K` or `--key`          | Path to ssl key file                                                                                                                                                                                                                             | `key.pem`         |
| `-r` or `--robots`       | Automatically provide a /robots.txt (The content of which defaults to `User-agent: *\nDisallow: /`)                                                                                                                                              | `false`           |
| `--no-dotfiles`          | Do not show dotfiles                                                                                                                                                                                                                             |                   |
| `--mimetypes`            | Path to a .types file for custom mimetype definition                                                                                                                                                                                             |                   |
| `-h` or `--help`         | Print this list and exit.                                                                                                                                                                                                                        |                   |
| `-v` or `--version`      | Print the version and exit.                                                                                                                                                                                                                      |                   |

## Magic Files

- `index.html` will be served as the default file to any directory requests.
- `404.html` will be served if a file is not found. This can be used for Single-Page App (SPA) hosting to serve the entry page.

## Catch-all redirect

To implement a catch-all redirect, use the index page itself as the proxy with:

```
auth-http-server --supabaseUrl [url] --supabaseKey [anonKey] [options] --proxy http://localhost:8080?
```

Note the `?` at the end of the proxy URL. Thanks to [@houston3](https://github.com/houston3) for this clever hack!

## TLS/SSL

First, you need to make sure that [openssl](https://github.com/openssl/openssl) is installed correctly, and you have `key.pem` and `cert.pem` files. You can generate them using this command:

``` sh
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
```

You will be prompted with a few questions after entering the command. Use `127.0.0.1` as value for `Common name` if you want to be able to install the certificate in your OS's root certificate store or browser so that it is trusted.

This generates a cert-key pair and it will be valid for 3650 days (about 10 years).

Then you need to run the server with `-S` for enabling SSL and `-C` for your certificate file.

``` sh
auth-http-server --supabaseUrl [url] --supabaseKey [anonKey] -S -C cert.pem
```

If you wish to use a passphrase with your private key you can include one in the openssl command via the -passout parameter (using password of foobar)


e.g.
`openssl req -newkey rsa:2048 -passout pass:foobar -keyout key.pem -x509 -days 365 -out cert.pem`

For security reasons, the passphrase will only be read from the `NODE_HTTP_SERVER_SSL_PASSPHRASE` environment variable.


This is what should be output if successful:

``` sh
Starting up auth-http-server, serving ./ through https

http-server settings:
CORS: disabled
Cache: 3600 seconds
Connection Timeout: 120 seconds
Directory Listings: visible
AutoIndex: visible
Serve GZIP Files: false
Serve Brotli Files: false
Default File Extension: none

Available on:
  https://127.0.0.1:8080
  https://192.168.1.101:8080
  https://192.168.1.104:8080
Hit CTRL-C to stop the server
```

# Development

Checkout this repository locally, then:

```sh
$ npm i
$ npm start
```

*Now you can visit http://localhost:8080 to view your server*

You should see the turtle image in the screenshot above hosted at that URL. See
the `./public` folder for demo content.
