// types/next-auth.d.ts
import type { DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt"; // ← "next-auth/jwt"'dan gelmeli

declare module "next-auth" {
  /**
   * useSession() ve auth() ile erişilen session nesnesi.
   *
   * Kullanım:
   *   const { data: session } = useSession();
   *   session?.token          → apiRequest({ token: session.token })
   *   session?.user.id        → string
   *   session?.user.role      → "Receiver" | "Provider" | "Admin"
   *   session?.user.name      → string | null  (NextAuth default)
   *   session?.user.email     → string | null  (NextAuth default)
   */
  interface Session {
    /** Backend JWT — tüm yetkili API isteklerinde Authorization header'ı için */
    token: string;
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"]; // name, email, image → NextAuth default'larını korur
  }

  /**
   * authorize() callback'inin döndürdüğü User.
   * Sadece jwt callback'e paslanır; doğrudan kullanılmaz.
   * id, name, email, image → NextAuth'un kendi DefaultUser'ından zaten geliyor,
   * burada sadece eklediğimiz alanlar tanımlanır.
   */
  interface User {
    accessToken: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  /** jwt() callback'te erişilen token — session()'ın kaynağı */
  interface JWT extends DefaultJWT {
    accessToken: string;
    role: string;
    id: string;
  }
}
