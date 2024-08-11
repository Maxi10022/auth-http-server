const { authFolderName } = require('../constants'); 

function redirectToLogin(res) {
  res.writeHead(302, {
    'Location': `/${authFolderName}/login.html`
  });
  return res.end();
}

function redirectTo500(res) {
  res.writeHead(302, {
    'Location': `/${authFolderName}/500.html`
  });
  return res.end();
}

/**
 * Determines whether the request should skip validation.
 * @param {Object} req - The request object.
 * @returns {boolean} - Returns true if the request URL matches any of the specified paths, otherwise false.
 */
function shouldSkipValidation(req) {
  return req.url === `/${authFolderName}/login.html`|| 
         req.url === `/${authFolderName}/auth.js` || 
         req.url === `/${authFolderName}/500.html`;
}

module.exports = {
  redirectToLogin,
  redirectTo500,
  shouldSkipValidation
};