'use strict';

var fs = require('fs'),
  union = require('union'),
  httpServerCore = require('./core'),
  httpProxy = require('http-proxy'),
  corser = require('corser'),
  { redirectToLogin, redirectTo500 } = require('./extensions/redirect-helpers'),
  cookieParser = require('cookie-parser'),
  { createClient } = require('@supabase/supabase-js');

//
// Remark: backwards compatibility for previous
// case convention of HTTP
//
exports.HttpServer = exports.HTTPServer = HttpServer;

/*
 * Returns a new instance of HttpServer with the
 * specified `options`.
 */
exports.createServer = function (options) {
  return new HttpServer(options);
};

/**
 * Constructor function for the HttpServer object
 * which is responsible for serving static files along
 * with other HTTP-related features.
 */
function HttpServer(options) {
  options = options || {};

  if (options.root) {
    this.root = options.root;
  } else {
    try {
      // eslint-disable-next-line no-sync
      fs.lstatSync('./public');
      this.root = './public';
    } catch (err) {
      this.root = './';
    }
  }

  this.headers = options.headers || {};
  this.headers['Accept-Ranges'] = 'bytes';

  this.cache = (
    // eslint-disable-next-line no-nested-ternary
    options.cache === undefined ? 3600 :
    // -1 is a special case to turn off caching.
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#Preventing_caching
      options.cache === -1 ? 'no-cache, no-store, must-revalidate' :
        options.cache // in seconds.
  );
  this.showDir = options.showDir !== 'false';
  this.autoIndex = options.autoIndex !== 'false';
  this.showDotfiles = options.showDotfiles;
  this.gzip = options.gzip === true;
  this.brotli = options.brotli === true;
  if (options.ext) {
    this.ext = options.ext === true
      ? 'html'
      : options.ext;
  }
  this.contentType = options.contentType ||
    this.ext === 'html' ? 'text/html' : 'application/octet-stream';

  var before = options.before ? options.before.slice() : [];

  if (options.logFn) {
    before.push(function (req, res) {
      options.logFn(req, res);
      res.emit('next');
    });
  }  

  if (options.supabaseKey || options.supabaseUrl) {

    console.log('Supabase credentials provided. Setting up auth middleware.');
    // create supabase client
    const _supabase = createClient(options.supabaseUrl, options.supabaseKey);

    // get valid roles
    const roles = options.roles || [];

    // auth folder constants, requirement only needed if auth middleware is used
    const { authFolderName } = require('./constants'); 

    before.push(async function (req, res) {      

      //skips middleware if login page is requested
      if (req.url === `/${authFolderName}/login.html` || 
        req.url === `/${authFolderName}/auth.js` || 
        req.url === `/${authFolderName}/500.html`) {            
        return res.emit('next');
      }

      const sessionCookie = req.headers.cookie
        ?.split('; ')
        ?.find(row => row.startsWith('session='))
        ?.split('=')[1];

      if (sessionCookie) { // if accessToken available
      
        const session = JSON.parse(sessionCookie);

        // get user, based on received access token
        const { data: { user } } = await _supabase.auth.getUser(session.access_token);
        
        // if user not found, redirect to login page
        if (!user) {
          return redirectToLogin(res);
        } 

        // get user roles
        const { data, error } = await _supabase
          .from('user_roles')
          .select('roles:role_id(name)');      

        // if error getting roles, redirect to 500 page
        if (error) {
          return redirectTo500(res);
        }          

        // resolve user roles data
        const userRoles = data.map(value => value.roles.name);

        const hasRole = userRoles.some(role => roles.includes(role));

        // if user has required role, continue
        if (hasRole) {
          return res.emit('next');
        }                     
      }

      // if no session cookie, 
      // or does not have any required role, redirect to login page
      return redirectToLogin(res);
    });
  }  

  if (options.cors) {
    this.headers['Access-Control-Allow-Origin'] = '*';
    this.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Range';
    if (options.corsHeaders) {
      options.corsHeaders.split(/\s*,\s*/)
        .forEach(function (h) { this.headers['Access-Control-Allow-Headers'] += ', ' + h; }, this);
    }
    before.push(corser.create(options.corsHeaders ? {
      requestHeaders: this.headers['Access-Control-Allow-Headers'].split(/\s*,\s*/)
    } : null));
  }

  if (options.robots) {
    before.push(function (req, res) {
      if (req.url === '/robots.txt') {
        res.setHeader('Content-Type', 'text/plain');
        var robots = options.robots === true
          ? 'User-agent: *\nDisallow: /'
          : options.robots.replace(/\\n/, '\n');

        return res.end(robots);
      }

      res.emit('next');
    });
  }

  before.push(httpServerCore({
    root: this.root,
    cache: this.cache,
    showDir: this.showDir,
    showDotfiles: this.showDotfiles,
    autoIndex: this.autoIndex,
    defaultExt: this.ext,
    gzip: this.gzip,
    brotli: this.brotli,
    contentType: this.contentType,
    mimetypes: options.mimetypes,
    handleError: typeof options.proxy !== 'string'
  }));

  if (typeof options.proxy === 'string') {
    var proxyOptions = options.proxyOptions || {};
    var proxy = httpProxy.createProxyServer(proxyOptions);
    before.push(function (req, res) {
      proxy.web(req, res, {
        target: options.proxy,
        changeOrigin: true
      }, function (err, req, res) {
        if (options.logFn) {
          options.logFn(req, res, {
            message: err.message,
            status: res.statusCode });
        }
        res.emit('next');
      });
    });
  }

  var serverOptions = {
    before: before,
    headers: this.headers,
    onError: function (err, req, res) {
      if (options.logFn) {
        options.logFn(req, res, err);
      }

      res.end();
    }
  };

  if (options.https) {
    serverOptions.https = options.https;
  }

  this.server = serverOptions.https && serverOptions.https.passphrase
    // if passphrase is set, shim must be used as union does not support
    ? require('./shims/https-server-shim')(serverOptions)
    : union.createServer(serverOptions);

  if (options.timeout !== undefined) {
    this.server.setTimeout(options.timeout);
  }
}

HttpServer.prototype.listen = function () {
  this.server.listen.apply(this.server, arguments);
};

HttpServer.prototype.close = function () {
  return this.server.close();
};
