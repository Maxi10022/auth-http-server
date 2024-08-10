import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = '{{ supabase_url }}';
const supabaseKey = '{{ supabase_key }}';

const _supabase = createClient(supabaseUrl, supabaseKey);


export async function login(email, password) {
    
    const { data, error } = await _supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        alert('Login failed: ' + error.message);
    } else {
        const { access_token, refresh_token } = data.session;
        
        console.log(access_token, refresh_token);

        await _supabase.auth.setSession({
            access_token,
            refresh_token
        });

        const sessionJson = JSON.stringify(data.session);

        document.cookie = `session=${sessionJson};path=/`;

        window.location.href = '/index.html';
    }
}

export async function logout() {
    
    _supabase.auth.signOut();
}