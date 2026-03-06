// lib/auth.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { User } from "next-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Şifre", type: "password" },
        // ── 2FA passthrough alanları ────────────────────────────────────────
        // Standart login'de bu alanlar gönderilmez.
        // Login.tsx 2FA'yı tamamladıktan sonra signIn("credentials", { verifiedToken, ... })
        // çağırır ve authorize() doğrudan bu token'ı session'a yazar.
        verifiedToken: { label: "Token", type: "text" },
        verifiedRole: { label: "Role", type: "text" },
        verifiedName: { label: "FullName", type: "text" },
        verifiedId: { label: "UserId", type: "text" },
      },

      async authorize(credentials): Promise<User | null> {
        // ── Path A: 2FA akışı tamamlandı ─────────────────────────────────
        // Login.tsx, 2FA verify endpoint'inden aldığı JWT'yi burada paslar.
        // Ekstra API isteği yapılmaz.
        if (credentials?.verifiedToken) {
          return {
            id: String(credentials.verifiedId ?? ""),
            name: String(credentials.verifiedName ?? ""),
            email: String(credentials.email ?? ""),
            accessToken: String(credentials.verifiedToken),
            role: String(credentials.verifiedRole ?? ""),
          };
        }

        // ── Path B: Standart email + şifre girişi ────────────────────────
        // authorize() sunucu taraflı çalışır; apiRequest client'ı buraya
        // import edilemez, bu yüzden fetch direkt kullanılır.
        // Not: trusted_device cookie sunucu-sunucu fetch'te taşınamaz.
        // Cookie kontrolü Login.tsx'te client taraflı loginUser() içinde yapılır.
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials?.email ?? "",
                password: credentials?.password ?? "",
              }),
            },
          );

          const data = await res.json();
          if (!res.ok || !data.success) return null;

          // 2FA gerekiyor → null döndür; NextAuth session oluşturmaz.
          // Login.tsx requiresTwoFactor bayrağını zaten loginUser() üzerinden
          // kontrol ediyor ve 2FA adımını kendi yönetiyor.
          if (data.data?.requiresTwoFactor) return null;

          return {
            id: String(data.data.userId),
            name: data.data.fullName,
            email: String(credentials?.email ?? ""),
            accessToken: data.data.token,
            role: data.data.role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // user yalnızca ilk oturum açma anında gelir.
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
        token.id = user.id ?? "";
      }
      return token;
    },

    async session({ session, token }) {
      session.token = (token.accessToken as string) ?? "";
      session.user.id = (token.id as string) ?? "";
      session.user.role = (token.role as string) ?? "";
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 gün
    updateAge: 60 * 60 * 24, // session her 24 saatte bir yenilenir
  },
});
