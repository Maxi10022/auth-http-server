
function redirectToLogin(res) {
  res.writeHead(302, {
    'Location': '/KnqUhVIxiEkb/login.html'
  });
  return res.end();
}

function redirectTo500(res) {
  res.writeHead(302, {
    'Location': '/KnqUhVIxiEkb/500.html'
  });
  return res.end();
}

function skipIfResourcePublic(req, res) {
  if (req.url === '/KnqUhVIxiEkb/login.html' || 
    req.url === '/KnqUhVIxiEkb/auth.js' || 
    req.url === '/KnqUhVIxiEkb/500.html') {            
    
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