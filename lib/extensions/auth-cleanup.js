
function clearAuthFiles(root){
    const fs = require('fs');

    const authDirectory = root + '\\KnqUhVIxiEkb';

    if (fs.existsSync(authDirectory)) {
        fs.rmSync(authDirectory, { recursive: true, force: true });
    }
}

module.exports = clearAuthFiles;