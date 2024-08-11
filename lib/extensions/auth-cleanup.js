
function clearAuthFiles(root){
    const fs = require('fs');
    const { authFolderName } = require('../constants');

    const authDirectory = root + '\\' + authFolderName;

    if (fs.existsSync(authDirectory)) {
        fs.rmSync(authDirectory, { recursive: true, force: true });
    }
}

module.exports = clearAuthFiles;