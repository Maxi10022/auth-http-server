
async function setupLoginFiles(options) {

    // Copy auth.js file with the Supabase credentials

    const { renderFile } = require('template-file');
    const fs = require('fs');

    const root = options.root;

    // Prepare template data
    const data = {
        supabase_key: options.supabaseKey,
        supabase_url: options.supabaseUrl
    };

    const jsFilePathDestination = `${root}/auth.js`;

    const jsFilePathSource = `${__dirname}\\resources\\auth.js`;

    // Render the template file with the data
    const renderedFile = await renderFile(jsFilePathSource, data);

    // Write the rendered file to the destination
    fs.writeFileSync(jsFilePathDestination, renderedFile);

    // Copy login.html file
    const htmlFilePathSource = `${__dirname}\\resources\\login.html`;

    const htmlFilePathDestination = `${root}/login.html`;

    // Copy the login.html file to the destination
    fs.copyFileSync(htmlFilePathSource, htmlFilePathDestination);
}

module.exports = setupLoginFiles;