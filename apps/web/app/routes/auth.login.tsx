import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  // APIサーバーからOAuth URLを取得
  const response = await fetch('http://api:8787/auth/login');
  const data = await response.json();
  
  if (data.authUrl) {
    // stateをセッションストレージ用に返す
    return json({ 
      authUrl: data.authUrl,
      state: data.state 
    });
  }
  
  return json({ error: 'Failed to get auth URL' }, { status: 500 });
}

export default function AuthLogin() {
  // このページは直接アクセスされることはない
  return null;
}