import { createClient } from "@supabase/supabase-js";

// 서버(Route Handler)에서만 사용하는 클라이언트입니다.
// service role 키를 쓰기 때문에 절대 클라이언트 번들에 노출되면 안 됩니다.
export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다. .env.local 에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 를 채워주세요."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
