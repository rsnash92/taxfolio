#!/usr/bin/env npx tsx
/**
 * HMRC Agent Sandbox Test Setup
 *
 * Creates a test agent, test individual (client), links them together,
 * and verifies the agent can make API calls on behalf of the client.
 *
 * Prerequisites:
 *   - Sandbox app subscribed to: Create Test User API, Agent Authorisation (v1 + v2),
 *     Agent Authorisation Test Support
 *   - HMRC_SANDBOX_CLIENT_ID and HMRC_SANDBOX_CLIENT_SECRET env vars set
 *     (or pass as command-line args)
 *
 * Usage:
 *   npx tsx scripts/setup-agent-sandbox.ts
 *
 *   # Or with explicit credentials:
 *   HMRC_SANDBOX_CLIENT_ID=xxx HMRC_SANDBOX_CLIENT_SECRET=yyy npx tsx scripts/setup-agent-sandbox.ts
 *
 * Output:
 *   Saves all test credentials to scripts/agent-test-credentials.json
 */

const BASE_URL = 'https://test-api.service.hmrc.gov.uk';

const CLIENT_ID = process.env.HMRC_SANDBOX_CLIENT_ID;
const CLIENT_SECRET = process.env.HMRC_SANDBOX_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Set HMRC_SANDBOX_CLIENT_ID and HMRC_SANDBOX_CLIENT_SECRET environment variables');
  console.error('   Find these on: https://developer.service.hmrc.gov.uk/developer/applications');
  process.exit(1);
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

async function hmrcRequest(path: string, options: RequestInit = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.hmrc.1.0+json',
      ...options.headers,
    },
  });

  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    console.error(`❌ ${res.status} ${res.statusText} — ${path}`);
    console.error(JSON.stringify(data, null, 2));
    throw new Error(`HMRC API error: ${res.status}`);
  }

  return data;
}

// ─── Step 1: Get application-restricted token ──────────────────────────────────

async function getServerToken(): Promise<string> {
  console.log('\n📋 Step 1: Getting application-restricted access token...');

  const res = await fetch(`${BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
      grant_type: 'client_credentials',
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    console.error('❌ Failed to get server token:', data);
    throw new Error('Could not get application-restricted token');
  }

  console.log('✅ Got server token (expires in', data.expires_in, 'seconds)');
  return data.access_token;
}

// ─── Step 2: Create test agent ─────────────────────────────────────────────────

interface AgentCredentials {
  userId: string;
  password: string;
  userFullName: string;
  emailAddress: string;
  agentServicesAccountNumber: string; // This is the ARN
  groupIdentifier: string;
}

async function createTestAgent(serverToken: string): Promise<AgentCredentials> {
  console.log('\n👤 Step 2: Creating test agent...');

  const data = await hmrcRequest('/create-test-user/agents', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${serverToken}` },
    body: JSON.stringify({
      serviceNames: ['agent-services'],
    }),
  });

  console.log('✅ Agent created:');
  console.log(`   Name:     ${data.userFullName}`);
  console.log(`   User ID:  ${data.userId}`);
  console.log(`   Password: ${data.password}`);
  console.log(`   ARN:      ${data.agentServicesAccountNumber}`);
  console.log(`   Group ID: ${data.groupIdentifier}`);

  return data;
}

// ─── Step 3: Create test individual (the "client") ─────────────────────────────

interface IndividualCredentials {
  userId: string;
  password: string;
  userFullName: string;
  emailAddress: string;
  individualDetails: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    address: {
      line1: string;
      line2: string;
      postcode: string;
    };
  };
  saUtr: string;
  nino: string;
  mtdItId: string;
}

async function createTestIndividual(serverToken: string): Promise<IndividualCredentials> {
  console.log('\n👤 Step 3: Creating test individual (client)...');

  const data = await hmrcRequest('/create-test-user/individuals', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${serverToken}` },
    body: JSON.stringify({
      serviceNames: ['self-assessment', 'mtd-income-tax'],
    }),
  });

  console.log('✅ Individual created:');
  console.log(`   Name:    ${data.userFullName}`);
  console.log(`   User ID: ${data.userId}`);
  console.log(`   NINO:    ${data.nino}`);
  console.log(`   MTD ID:  ${data.mtdItId}`);
  console.log(`   SA UTR:  ${data.saUtr}`);
  console.log(`   DOB:     ${data.individualDetails?.dateOfBirth}`);

  return data;
}

// ─── Step 4: Get agent OAuth token ─────────────────────────────────────────────

interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

async function checkPort3000Free(): Promise<void> {
  const net = await import('net');
  return new Promise((resolve, reject) => {
    const tester = net.createServer()
      .once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(
            'Port 3000 is in use (probably your Next.js dev server).\n' +
            '   Stop it first (Ctrl+C in that terminal), then re-run this script.'
          ));
        } else {
          reject(err);
        }
      })
      .once('listening', () => {
        tester.close(() => resolve());
      })
      .listen(3000);
  });
}

async function getAgentOAuthToken(agent: AgentCredentials): Promise<OAuthTokens> {
  console.log('\n🔐 Step 4: Getting agent OAuth token...');
  console.log('   Checking port 3000 is free...');

  await checkPort3000Free();

  // Use the redirect URI registered with your HMRC sandbox app
  const REDIRECT_URI = 'http://localhost:3000/api/mtd/auth/callback';

  const { createServer } = await import('http');
  const { URL } = await import('url');

  return new Promise((resolve, reject) => {
    const server = createServer(async (req, res) => {
      const url = new URL(req.url!, 'http://localhost:3000');

      // Catch the HMRC OAuth callback
      if (url.pathname === '/api/mtd/auth/callback') {
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<h1>Authorization denied</h1><p>You can close this window.</p>');
          server.close();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }

        if (code) {
          try {
            // Exchange code for tokens
            const tokenRes = await fetch(`${BASE_URL}/oauth/token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                client_id: CLIENT_ID!,
                client_secret: CLIENT_SECRET!,
                grant_type: 'authorization_code',
                redirect_uri: REDIRECT_URI,
                code: code,
              }),
            });

            const tokens = await tokenRes.json();

            if (!tokenRes.ok) {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end('<h1>Token exchange failed</h1><p>Check the console.</p>');
              server.close();
              reject(new Error(`Token exchange failed: ${JSON.stringify(tokens)}`));
              return;
            }

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <html><body style="font-family: system-ui; max-width: 500px; margin: 60px auto; text-align: center;">
                <h1 style="color: #16a34a;">Agent authorized!</h1>
                <p>Token obtained successfully. You can close this window.</p>
                <p style="color: #666; font-size: 13px;">The script is continuing in your terminal...</p>
              </body></html>
            `);
            server.close();

            console.log('✅ Agent OAuth token obtained');
            console.log(`   Scope: ${tokens.scope}`);
            console.log(`   Expires in: ${tokens.expires_in}s`);
            resolve(tokens);
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<h1>Error exchanging token</h1>');
            server.close();
            reject(err);
          }
          return;
        }
      }

      // Any other request — send a simple redirect hint
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Waiting for HMRC OAuth callback...');
    });

    server.listen(3000, () => {
      const scope = 'read:self-assessment write:self-assessment write:sent-invitations';
      const authUrl = `${BASE_URL}/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

      console.log('   Temporary server listening on port 3000\n');
      console.log('   ┌─────────────────────────────────────────────────────┐');
      console.log('   │ Sign in with the AGENT credentials:                │');
      console.log(`   │ User ID:  ${agent.userId.padEnd(40)}│`);
      console.log(`   │ Password: ${agent.password.padEnd(40)}│`);
      console.log('   │                                                     │');
      console.log('   │ Then click "Grant authority"                        │');
      console.log('   └─────────────────────────────────────────────────────┘');
      console.log(`\n   Opening browser...\n`);

      // Open browser
      const { exec } = require('child_process');
      const openCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
      exec(`${openCmd} "${authUrl}"`);
    });

    // Timeout after 3 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('OAuth timeout (3 min) — did you sign in and grant authority?'));
    }, 180_000);
  });
}

// ─── Step 5: Link agent to client ──────────────────────────────────────────────

async function linkAgentToClient(
  agentToken: string,
  agentArn: string,
  clientNino: string,
  clientPostcode: string
): Promise<void> {
  console.log('\n🔗 Step 5: Linking agent to client...');

  // Step 5a: Create invitation via Agent Authorisation API
  console.log('   Creating invitation...');
  const inviteRes = await fetch(`${BASE_URL}/agents/${agentArn}/invitations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/vnd.hmrc.1.0+json',
      'Authorization': `Bearer ${agentToken}`,
    },
    body: JSON.stringify({
      service: ['MTD-IT'],
      clientType: 'personal',
      clientIdType: 'ni',
      clientId: clientNino,
      knownFact: clientPostcode,
    }),
  });

  if (!inviteRes.ok) {
    const errText = await inviteRes.text();
    console.error(`❌ ${inviteRes.status} — POST /agents/${agentArn}/invitations`);
    console.error(errText);
    throw new Error(`Failed to create invitation: ${inviteRes.status}`);
  }

  // Extract invitation ID from Location header
  const location = inviteRes.headers.get('location') || '';
  const invitationId = location.split('/').pop();

  if (!invitationId) {
    throw new Error('No invitation ID in Location header: ' + location);
  }

  console.log(`   Invitation created: ${invitationId}`);

  // Step 5b: Accept invitation via Test Support API
  console.log('   Accepting invitation via Test Support API...');
  const acceptRes = await fetch(`${BASE_URL}/agent-authorisation-test-support/invitations/${invitationId}`, {
    method: 'PUT',
    headers: {
      'Accept': 'application/vnd.hmrc.1.0+json',
      'Content-Length': '0',
    },
  });

  if (!acceptRes.ok) {
    const errText = await acceptRes.text();
    console.error(`❌ ${acceptRes.status} — PUT /agent-authorisation-test-support/invitations/${invitationId}`);
    console.error(errText);
    throw new Error(`Failed to accept invitation: ${acceptRes.status}`);
  }

  console.log('✅ Agent-client relationship created');
  console.log(`   Agent ARN: ${agentArn}`);
  console.log(`   Client NINO: ${clientNino}`);
}

// ─── Step 6: Verify — fetch client's business details via agent token ──────────

async function verifyAgentAccess(agentToken: string, clientNino: string): Promise<void> {
  console.log('\n🔍 Step 6: Verifying agent can access client data...');

  try {
    const data = await hmrcRequest(
      `/individuals/business/details/${clientNino}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${agentToken}`,
          'Accept': 'application/vnd.hmrc.2.0+json',
        },
      }
    );

    console.log('✅ Agent can access client business details:');
    console.log(JSON.stringify(data, null, 2));
  } catch (err: any) {
    if (err.message?.includes('404')) {
      console.log('⚠️  No business details found (expected for fresh test user — client needs to register for MTD)');
      console.log('   The important thing is we didn\'t get 403 UNAUTHORISED — the agent-client link works.');
    } else {
      throw err;
    }
  }

  // Also try fetching obligations
  try {
    const obligations = await hmrcRequest(
      `/individuals/income-tax/obligations/${clientNino}?taxYear=2025-26`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${agentToken}`,
          'Accept': 'application/vnd.hmrc.3.0+json',
        },
      }
    );

    console.log('\n✅ Agent can fetch client obligations:');
    console.log(JSON.stringify(obligations, null, 2));
  } catch (err: any) {
    if (err.message?.includes('404') || err.message?.includes('403')) {
      console.log('⚠️  Could not fetch obligations (may need business setup first)');
    } else {
      throw err;
    }
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  HMRC Agent Sandbox Test Setup');
  console.log('  Creates agent + client, links them, verifies access');
  console.log('═══════════════════════════════════════════════════════════');

  // Step 1: Application-restricted token (for Create Test User API)
  const serverToken = await getServerToken();

  // Step 2: Create test agent
  const agent = await createTestAgent(serverToken);

  // Step 3: Create test individual
  const individual = await createTestIndividual(serverToken);

  // Step 4: Get agent OAuth token (requires browser sign-in)
  const agentTokens = await getAgentOAuthToken(agent);

  // Step 5: Link agent to client (requires Agent Authorisation Test Support subscription)
  let linked = false;
  try {
    await linkAgentToClient(
      agentTokens.access_token,
      agent.agentServicesAccountNumber,
      individual.nino,
      individual.individualDetails.address.postcode
    );
    linked = true;
  } catch (err: any) {
    console.log('\n⚠️  Step 5 failed — this usually means your sandbox app');
    console.log('   is not subscribed to "Agent Authorisation Test Support".');
    console.log('   Subscribe at: https://developer.service.hmrc.gov.uk/developer/applications');
    console.log('   → Your app → API subscriptions → Add "Agent Authorisation Test Support"');
    console.log('   You can re-link later or test without the relationship.\n');
  }

  // Step 6: Verify the agent can access client data
  if (linked) {
    await verifyAgentAccess(agentTokens.access_token, individual.nino);
  } else {
    console.log('🔍 Step 6: Skipping verification (agent-client not linked yet)');
  }

  // ─── Save credentials ──────────────────────────────────────────────────────

  const credentials = {
    created: new Date().toISOString(),
    agent: {
      userId: agent.userId,
      password: agent.password,
      fullName: agent.userFullName,
      arn: agent.agentServicesAccountNumber,
      groupId: agent.groupIdentifier,
    },
    individual: {
      userId: individual.userId,
      password: individual.password,
      fullName: individual.userFullName,
      nino: individual.nino,
      mtdItId: individual.mtdItId,
      saUtr: individual.saUtr,
      dateOfBirth: individual.individualDetails.dateOfBirth,
      address: individual.individualDetails.address,
    },
    linked,
    agentOAuth: {
      accessToken: agentTokens.access_token,
      refreshToken: agentTokens.refresh_token,
      expiresIn: agentTokens.expires_in,
      scope: agentTokens.scope,
      obtainedAt: new Date().toISOString(),
    },
    notes: {
      agentClientRelationship: 'MTD-IT',
      sandboxBaseUrl: BASE_URL,
      tokenRefresh: 'Use refresh_token with grant_type=refresh_token to get new access_token',
      testUserExpiry: 'Test users deleted after 3 months of inactivity',
    },
  };

  const fs = await import('fs');
  const path = await import('path');
  const outPath = path.join(process.cwd(), 'scripts', 'agent-test-credentials.json');

  // Ensure scripts directory exists
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(credentials, null, 2));

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  ✅ Setup complete!');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`\n  Credentials saved to: ${outPath}`);
  console.log('  ⚠️  Add agent-test-credentials.json to .gitignore!\n');
  console.log('  Next steps:');
  console.log('  1. Use the agent OAuth token to test your practice HMRC API calls');
  console.log('  2. The agent ARN goes in your practices.hmrc_arn column');
  console.log('  3. The client NINO goes in your clients.nino_encrypted column');
  console.log('  4. Test the full flow: create practice → add client → fetch obligations');
}

main().catch((err) => {
  console.error('\n❌ Setup failed:', err.message);
  process.exit(1);
});
