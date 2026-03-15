import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";
import { DefaultAzureCredential } from "npm:@azure/identity@4.7.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const connectionString = Deno.env.get('AZURE_DATABASE_URL');

async function getConnectionWithTokenAuth(connUrl: URL): Promise<ReturnType<typeof postgres> | null> {
  try {
    console.log('Attempting DefaultAzureCredential token-based auth...');
    const credential = new DefaultAzureCredential();
    const token = await credential.getToken('https://ossrdbms-aad.database.windows.net/.default');
    
    if (token?.token) {
      console.log('Successfully obtained Azure AD token');
      const sql = postgres({
        host: connUrl.hostname,
        port: parseInt(connUrl.port || '5432'),
        database: connUrl.pathname.slice(1),
        username: connUrl.username,
        password: token.token,
        ssl: { rejectUnauthorized: false },
        max: 1,
        idle_timeout: 20,
      });
      // Test the connection
      await sql`SELECT 1`;
      console.log('Token-based connection successful');
      return sql;
    }
  } catch (e) {
    console.log('DefaultAzureCredential failed, will fall back to password:', e instanceof Error ? e.message : String(e));
  }
  return null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (!connectionString) {
    console.error('AZURE_DATABASE_URL is not set');
    return new Response(
      JSON.stringify({ error: 'Database connection not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  let connUrl: URL;
  try {
    connUrl = new URL(connectionString);
    console.log('Connecting to:', connUrl.hostname, 'as user:', connUrl.username, 'database:', connUrl.pathname.slice(1));
  } catch (e) {
    console.log('Connection string format check failed');
    return new Response(
      JSON.stringify({ error: 'Invalid connection string format' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  let sql;
  try {
    // Try DefaultAzureCredential first, fall back to password
    sql = await getConnectionWithTokenAuth(connUrl);
    
    if (!sql) {
      console.log('Falling back to password-based auth');
      sql = postgres(connectionString, {
        ssl: { rejectUnauthorized: false },
        max: 1,
        idle_timeout: 20,
      });
    }

    const { action, data } = await req.json();
    console.log('Received action:', action, 'with data:', JSON.stringify(data));

    let result;

    switch (action) {
      // ===== PARTICIPANTS =====
      case 'get_participant_by_email': {
        const rows = await sql`
          SELECT id, email, phone_number, full_name, rotation_pair, video_order, created_at
          FROM participants
          WHERE email = ${data.email}
          LIMIT 1
        `;
        result = rows.length > 0 ? rows[0] : null;
        break;
      }

      case 'create_participant': {
        const rows = await sql`
          INSERT INTO participants (email, phone_number, full_name, rotation_pair, video_order)
          VALUES (${data.email}, ${data.phone_number}, ${data.full_name}, ${data.rotation_pair}, ${data.video_order})
          RETURNING id, email, phone_number, full_name, rotation_pair, video_order, created_at
        `;
        result = rows[0];
        break;
      }

      case 'delete_participant': {
        await sql`
          DELETE FROM participants
          WHERE id = ${data.id}
        `;
        result = { success: true };
        break;
      }

      // ===== VIDEO RESPONSES =====
      case 'get_responses_by_participant': {
        const rows = await sql`
          SELECT id, participant_id, video_index, was_rotated, sympathy_rating, presentation_order, created_at
          FROM video_responses
          WHERE participant_id = ${data.participant_id}
        `;
        result = rows;
        break;
      }

      case 'create_video_response': {
        const rows = await sql`
          INSERT INTO video_responses (participant_id, video_index, was_rotated, sympathy_rating, presentation_order)
          VALUES (${data.participant_id}, ${data.video_index}, ${data.was_rotated}, ${data.sympathy_rating}, ${data.presentation_order})
          RETURNING id, participant_id, video_index, was_rotated, sympathy_rating, presentation_order, created_at
        `;
        result = rows[0];
        break;
      }

      case 'delete_responses_by_participant': {
        await sql`
          DELETE FROM video_responses
          WHERE participant_id = ${data.participant_id}
        `;
        result = { success: true };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    console.log('Action completed successfully:', action);
    await sql.end();

    return new Response(
      JSON.stringify({ data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Database error:', error);
    if (sql) {
      try {
        await sql.end();
      } catch (e) {
        console.error('Error closing connection:', e);
      }
    }
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
