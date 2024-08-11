const 
    { shouldSkipValidation, redirectTo500, redirectToLogin } = require('./redirect-helpers'),
    { createClient } = require('@supabase/supabase-js'),
    jwt = require('jsonwebtoken');

/**
 * Sets up the authentication middleware with the provided options.
 * 
 * @param {Object} options - The options for the middleware.
 * @returns {Function} The middleware function.
 */
function setupAuthMiddleware(options) {
    const jwtSecret = options.jwtSecret;
    
    // create supabase client
    const _supabase = createClient(options.supabaseUrl, options.supabaseKey);

    // get valid roles
    const roles = options.roles || [];

    return async function (req, res) {
        //skips middleware if should skip validation
        if (shouldSkipValidation(req)) {         
            return res.emit('next');
        }
        
        // get session cookie
        const sessionCookie = req.headers.cookie
            ?.split('; ')
            ?.find(row => row.startsWith('session='))
            ?.split('=')[1];

        // if no session cookie, redirect to login page
        if (!sessionCookie) {
            return redirectToLogin(res);
        }
    
        var session, decoded; 

        // parse session cookie, on error redirect to login page
        try {
            session = JSON.parse(sessionCookie);
        } catch (error) {
            return redirectToLogin(res);
        }
    
        // verify jwt token, on error redirect to 500 page
        jwt.verify(session.access_token, jwtSecret, async (err, decodedJwt) => {

            if (err) {                             
                return redirectTo500(res);
            }                             
            
            decoded = decodedJwt;
        });
        
        let roles = decoded.access_roles;

        // set roles if not already set
        if (!decoded.access_roles){
            // fetch user roles from database
            const { data, error } = await getRoles(decoded.sub);

            // if error, redirect to 500 page
            if (error) {
                console.log(error);   
                return redirectTo500(res);
            }

            // flatten response, and set roles
            roles = data.map(value => value.roles.name);

            // extend jwt with access_roles
            const newJwt = await extendJwtWithAccessRoles(decoded, roles);

            // set session cookie with new access token
            setSessionCookieWithNewAccessToken(res, session, newJwt);                
        }                       
       
        // check if user has any required role
        const hasRole = await hasAnyRequiredRole(userRoles = roles);

        // if has required role, continue
        if (hasRole) {
            return res.emit('next');
        }

        // if does not have required role, redirect to login page
        return redirectToLogin(res);
    }    

    async function hasAnyRequiredRole(userRoles) {

        const hasRole = userRoles.some(role => roles.includes(role));

        return hasRole;
    }

    /**
    * Retrieves the roles for a given user.
    * 
    * @param {string} userId - The ID of the user to retrieve roles for.
    * @returns {Promise<{ data: { roles: { name: any }[] }[] | null, error: PostgrestError | null }>} - Returns an object containing the data and error properties.
    */
    async function getRoles(userId) {
        return await _supabase
            .from('user_roles')
            .select('roles:role_id(name)')
            .eq('user_id', userId);   
    }

    async function extendJwtWithAccessRoles(resolvedJwt, roles) {
        const newJwt = await jwt.sign({
            ...resolvedJwt,
            access_roles: roles
        }, jwtSecret);

        return newJwt;
    }

    async function setSessionCookieWithNewAccessToken(res, session, accesToken) {
        session.access_token = accesToken;
        
        const sessionJson = JSON.stringify(session);
        
        res.setHeader('Set-Cookie', `session=${sessionJson};path=/;SameSite=Lax`);

        return session;
    }
}

exports.setupAuthMiddleware = setupAuthMiddleware;