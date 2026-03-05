"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getProviders, getBusinesses } from "@/lib/api";
import type { ProviderResponseDto, BusinessResponseDto } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Star, Building2 } from "lucide-react";
import {
  AdminPageHeader, AdminTable, Th, Td, Pagination, PageLoader, EmptyState,
} from "@/components/modules/admin/AdminShared";

const PAGE_SIZE = 15;

export default function AdminUsers() {
  const { data: session } = useSession();

  // Providers tab
  const [providers, setProviders] = useState<ProviderResponseDto[]>([]);
  const [provPages, setProvPages] = useState(0);
  const [provPage, setProvPage] = useState(1);
  const [provSearch, setProvSearch] = useState("");
  const [provLoading, setProvLoading] = useState(true);

  // Businesses tab (shows business owners / receivers context)
  const [businesses, setBusinesses] = useState<BusinessResponseDto[]>([]);
  const [bizPages, setBizPages] = useState(0);
  const [bizPage, setBizPage] = useState(1);
  const [bizSearch, setBizSearch] = useState("");
  const [bizLoading, setBizLoading] = useState(true);

  async function loadProviders(p = 1) {
    if (!session?.token) return;
    setProvLoading(true);
    try {
      const res = await getProviders({ keyword: provSearch || undefined, page: p, pageSize: PAGE_SIZE }, session.token);
      setProviders(res.data.items);
      setProvPages(res.data.totalPages);
      setProvPage(p);
    } catch { /* ignore */ }
    finally { setProvLoading(false); }
  }

  async function loadBusinesses(p = 1) {
    if (!session?.token) return;
    setBizLoading(true);
    try {
      const res = await getBusinesses({ keyword: bizSearch || undefined, page: p, pageSize: PAGE_SIZE }, session.token);
      setBusinesses(res.data.items);
      setBizPages(res.data.totalPages);
      setBizPage(p);
    } catch { /* ignore */ }
    finally { setBizLoading(false); }
  }

  useEffect(() => { loadProviders(1); }, [session?.token]);
  useEffect(() => { loadBusinesses(1); }, [session?.token]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Kullanıcılar"
        description="Sistemdeki provider ve işletme sahipleri."
      />

      <Tabs defaultValue="providers">
        <TabsList>
          <TabsTrigger value="providers">Providerlar ({providers.length})</TabsTrigger>
          <TabsTrigger value="businesses">İşletme Sahipleri ({businesses.length})</TabsTrigger>
        </TabsList>

        {/* ── Providers tab ── */}
        <TabsContent value="providers" className="space-y-4 mt-4">
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Provider ara..."
                value={provSearch} onChange={(e) => setProvSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadProviders(1)} />
            </div>
            <Button variant="outline" onClick={() => loadProviders(1)}>Ara</Button>
          </div>
          <Separator />
          {provLoading ? <PageLoader /> : providers.length === 0 ? <EmptyState /> : (
            <>
              <AdminTable>
                <thead>
                  <tr>
                    <Th>ID</Th>
                    <Th>Ad</Th>
                    <Th>Unvan</Th>
                    <Th>Puan</Th>
                    <Th>Yorumlar</Th>
                    <Th>Online Randevu</Th>
                    <Th>İşletmeler</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {providers.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                      <Td className="text-muted-foreground">#{p.id}</Td>
                      <Td className="font-medium">{p.userFullName}</Td>
                      <Td className="text-muted-foreground">{p.title}</Td>
                      <Td>
                        <span className="flex items-center gap-1 text-sm">
                          <Star className="size-3.5 fill-current text-yellow-500" />
                          {p.averageRating.toFixed(1)}
                        </span>
                      </Td>
                      <Td className="text-muted-foreground">{p.totalReviews}</Td>
                      <Td>
                        <Badge variant={p.acceptsOnlineBooking ? "default" : "secondary"}>
                          {p.acceptsOnlineBooking ? "Evet" : "Hayır"}
                        </Badge>
                      </Td>
                      <Td>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Building2 className="size-3.5" />
                          {p.businesses.length}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
              <Pagination page={provPage} totalPages={provPages} onPage={loadProviders} />
            </>
          )}
        </TabsContent>

        {/* ── Businesses tab ── */}
        <TabsContent value="businesses" className="space-y-4 mt-4">
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="İşletme ara..."
                value={bizSearch} onChange={(e) => setBizSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadBusinesses(1)} />
            </div>
            <Button variant="outline" onClick={() => loadBusinesses(1)}>Ara</Button>
          </div>
          <Separator />
          {bizLoading ? <PageLoader /> : businesses.length === 0 ? <EmptyState /> : (
            <>
              <AdminTable>
                <thead>
                  <tr>
                    <Th>ID</Th>
                    <Th>İşletme Adı</Th>
                    <Th>Provider</Th>
                    <Th>Şehir</Th>
                    <Th>Telefon</Th>
                    <Th>E-posta</Th>
                    <Th>Durum</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {businesses.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/40 transition-colors">
                      <Td className="text-muted-foreground">#{b.id}</Td>
                      <Td className="font-medium">{b.name}</Td>
                      <Td className="text-muted-foreground">{b.providerName ?? "—"}</Td>
                      <Td className="text-muted-foreground">{b.city ?? "—"}</Td>
                      <Td className="text-muted-foreground">{b.phone ?? "—"}</Td>
                      <Td className="text-muted-foreground">{b.email ?? "—"}</Td>
                      <Td>
                        <Badge variant={b.isVerified ? "default" : "secondary"}>
                          {b.isVerified ? "Onaylı" : "Onaysız"}
                        </Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </AdminTable>
              <Pagination page={bizPage} totalPages={bizPages} onPage={loadBusinesses} />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}