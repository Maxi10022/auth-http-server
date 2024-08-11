
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

function skipIfResourcePublic(req, res) {
  if (req.url === `/${authFolderName}/login.html`|| 
    req.url === `/${authFolderName}/auth.js` || 
    req.url === `/${authFolderName}/500.html`) {            
    
    res.emit('next');
    return true;
  }
  
  return false;
}

module.exports = {
  redirectToLogin,
  redirectTo500,
  skipIfResourcePublic
};