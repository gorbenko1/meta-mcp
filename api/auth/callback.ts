import { NextApiRequest, NextApiResponse } from 'next';
import { UserAuthManager, UserSession } from '../../src/utils/user-auth.js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, state, error } = req.query;

    // Check for OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      return res.status(400).json({
        success: false,
        error: 'OAuth authorization failed',
        details: error
      });
    }

    // Validate required parameters
    if (!code || !state) {
      return res.status(400).json({
        success: false,
        error: 'Missing authorization code or state parameter'
      });
    }

    // Validate state parameter (CSRF protection)
    const cookies = req.headers.cookie || '';
    const oauthStateCookie = cookies
      .split(';')
      .find(c => c.trim().startsWith('oauth_state='))
      ?.split('=')[1];

    console.log('Debug CSRF validation:', {
      receivedState: state,
      cookieState: oauthStateCookie,
      allCookies: cookies,
      match: oauthStateCookie === state
    });

    if (!oauthStateCookie || oauthStateCookie !== state) {
      return res.status(400).json({
        success: false,
        error: 'Invalid state parameter - possible CSRF attack',
        debug: {
          receivedState: state,
          cookieState: oauthStateCookie,
          cookiesPresent: !!cookies
        }
      });
    }

    // Exchange authorization code for access token
    const tokens = await UserAuthManager.exchangeCodeForTokens(code as string);

    // Get user information from Meta
    const userInfo = await UserAuthManager.getMetaUserInfo(tokens.accessToken);

    // Create user session
    const userId = `meta_${userInfo.id}`;
    const session: UserSession = {
      userId: userId,
      email: userInfo.email,
      name: userInfo.name,
      metaUserId: userInfo.id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiration: tokens.expiresIn ? new Date(Date.now() + tokens.expiresIn * 1000) : undefined,
      createdAt: new Date(),
      lastUsed: new Date(),
    };

    // Store user session and tokens
    await UserAuthManager.storeUserSession(session);
    await UserAuthManager.storeUserTokens(userId, tokens);

    // Generate JWT session token
    const sessionToken = await UserAuthManager.createSessionToken(userId);

    // Clear OAuth state cookie and set session cookie
    res.setHeader('Set-Cookie', [
      `oauth_state=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/`, // Clear state cookie
      `session_token=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=${7 * 24 * 60 * 60}; Path=/`, // 7 days
    ]);

    // Return success with user info and MCP endpoint
    const mcpEndpoint = `${req.headers.host}/api/mcp`;
    
    res.status(200).json({
      success: true,
      user: {
        id: userId,
        name: userInfo.name,
        email: userInfo.email,
        metaUserId: userInfo.id,
      },
      mcpEndpoint: `https://${mcpEndpoint}`,
      sessionToken: sessionToken,
      message: 'Authentication successful. You can now use the MCP endpoint with your personal Meta account.'
    });
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}