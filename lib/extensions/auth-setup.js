
async function setupLoginFiles(root, options) {

    // Copy auth.js file with the Supabase credentials

    const { renderFile } = require('template-file');
    const fs = require('fs');
    const { authFolderName } = require('../constants'); 

    // Prepare template data
    const data = {
        supabase_key: options.supabaseAnonKey,
        supabase_url: options.supabaseUrl
    };

    const sourcePath = `${__dirname}\\resources`;
    const destinationPath = `${root}\\${authFolderName}`;

    if (!fs.existsSync(destinationPath)){
        fs.mkdirSync(destinationPath, { recursive: true });
    }

    // Render the template file with the data
    const renderedFile = await renderFile(`${sourcePath}\\auth.js`, data);

    // Write the rendered file to the destination
    fs.writeFileSync(`${destinationPath}/auth.js`, renderedFile);

    // Copy the login.html file to the destination
    fs.copyFileSync(`${sourcePath}\\login.html`, `${destinationPath}/login.html`);

    // Copy the 500.html file to the destination
    fs.copyFileSync(`${sourcePath}\\500.html`, `${destinationPath}/500.html`);
}

module.exports = setupLoginFiles;