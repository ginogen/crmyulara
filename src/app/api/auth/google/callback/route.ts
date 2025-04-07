// Comentado temporalmente para el deploy
/*
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.redirect('/auth/error?error=NoCodeProvided');
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
    );

    try {
      const { tokens } = await oauth2Client.getToken(code);
      return NextResponse.redirect('/auth/success?tokens=' + encodeURIComponent(JSON.stringify(tokens)));
    } catch (tokenError) {
      console.error('Error getting tokens:', tokenError);
      return NextResponse.redirect('/auth/error?error=TokenError');
    }
  } catch (error) {
    console.error('Error in Google callback:', error);
    return NextResponse.redirect('/auth/error?error=ServerError');
  }
}
*/ 