import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // 요청 상세(detail)는 요청 유형별로 모양이 달라 any로 주고받습니다.
      "@typescript-eslint/no-explicit-any": "off",
      // 로그인 없이 세션 정보를 클라이언트에서만 확인/리다이렉트하는
      // 초기화 패턴이라 의도적으로 이렇게 작성했습니다.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
