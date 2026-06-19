"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { AdminPageHeader, AdminPageShell } from "@/components/admin/AdminSidebar";
import CapabilityGate from "@/components/admin/CapabilityGate";
import { useAdminContext } from "@/context/AdminContext";
import { formatAdminWhen } from "@/lib/admin/format";
import { cabinetCardClass } from "@/lib/cabinet-ui";
import type { LegalSection } from "@/data/legal-content";
import type { CmsDocument, CmsLegalBody, CmsRevision } from "@/types/cms-content";

type Props = {
  documentId: string;
};

type DocumentResponse = { document?: CmsDocument; error?: string };
type RevisionsResponse = { revisions?: CmsRevision[] };

function linesToList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function listToLines(items?: string[]): string {
  return items?.join("\n") ?? "";
}

export default function ContentDocumentEditorView({ documentId }: Props) {
  const router = useRouter();
  const { hasCapability } = useAdminContext();
  const canPublish = hasCapability("content.publish");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doc, setDoc] = useState<CmsDocument | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sections, setSections] = useState<LegalSection[]>([]);
  const [status, setStatus] = useState<CmsDocument["status"]>("draft");
  const [revisions, setRevisions] = useState<CmsRevision[]>([]);

  const encodedId = encodeURIComponent(documentId);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [docRes, revRes] = await Promise.all([
        fetch(`/api/admin/content/documents/${encodedId}`),
        fetch(`/api/admin/content/documents/${encodedId}/revisions`),
      ]);
      const docJson = (await docRes.json()) as DocumentResponse;
      const revJson = (await revRes.json()) as RevisionsResponse;

      if (!docRes.ok || !docJson.document) {
        throw new Error(docJson.error ?? "Документ не найден");
      }

      const document = docJson.document;
      setDoc(document);
      setTitle(document.title);
      setStatus(document.status);

      if (document.body.kind === "legal") {
        setDescription(document.body.description);
        setSections(document.body.sections);
      }

      setRevisions(revJson.revisions ?? []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [encodedId]);

  useEffect(() => {
    void load();
  }, [load]);

  function buildBody(): CmsLegalBody {
    return {
      kind: "legal",
      description: description.trim(),
      sections,
    };
  }

  async function saveDraft() {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content/documents/${encodedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: buildBody(), status: "draft" }),
      });
      const json = (await res.json()) as DocumentResponse;
      if (!res.ok) throw new Error(json.error ?? "Ошибка сохранения");
      await load();
    } catch (saveError) {
      alert(saveError instanceof Error ? saveError.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!canPublish) return;
    setSaving(true);
    try {
      await fetch(`/api/admin/content/documents/${encodedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: buildBody() }),
      });
      const res = await fetch(`/api/admin/content/documents/${encodedId}/publish`, {
        method: "POST",
      });
      const json = (await res.json()) as DocumentResponse;
      if (!res.ok) throw new Error(json.error ?? "Ошибка публикации");
      await load();
    } catch (publishError) {
      alert(publishError instanceof Error ? publishError.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  async function removeOverride() {
    if (!canPublish) return;
    if (!window.confirm("Удалить CMS-версию? На сайте снова будет файл из репозитория.")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/content/documents/${encodedId}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Ошибка удаления");
      router.push("/admin/content/documents");
    } catch (deleteError) {
      alert(deleteError instanceof Error ? deleteError.message : "Ошибка");
    } finally {
      setSaving(false);
    }
  }

  function updateSection(index: number, patch: Partial<LegalSection>) {
    setSections((prev) => prev.map((section, i) => (i === index ? { ...section, ...patch } : section)));
  }

  function addSection() {
    setSections((prev) => [...prev, { heading: "", paragraphs: [""] }]);
  }

  function removeSection(index: number) {
    setSections((prev) => prev.filter((_, i) => i !== index));
  }

  if (loading) {
    return (
      <CapabilityGate capability="content.edit">
        <AdminPageShell>
          <p className="text-sm text-slate">Загрузка редактора…</p>
        </AdminPageShell>
      </CapabilityGate>
    );
  }

  if (error || !doc) {
    return (
      <CapabilityGate capability="content.edit">
        <AdminPageShell>
          <p className="text-sm text-red-600">{error ?? "Документ не найден"}</p>
          <Link href="/admin/content/documents" className="mt-4 inline-block text-sm text-sky hover:underline">
            ← К списку
          </Link>
        </AdminPageShell>
      </CapabilityGate>
    );
  }

  if (doc.body.kind !== "legal") {
    return (
      <CapabilityGate capability="content.edit">
        <AdminPageShell>
          <p className="text-sm text-slate">Редактор v1.2 поддерживает только legal-документы.</p>
        </AdminPageShell>
      </CapabilityGate>
    );
  }

  return (
    <CapabilityGate capability="content.edit">
      <AdminPageShell>
        <AdminPageHeader
          title={title || doc.title}
          subtitle={`CMS · ${doc.docType} · ${doc.slug} · ${status}`}
          actions={
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={saving} onClick={() => void saveDraft()}>
                Сохранить черновик
              </Button>
              {canPublish ? (
                <Button disabled={saving} onClick={() => void publish()}>
                  Опубликовать
                </Button>
              ) : null}
              <Link
                href={`/legal/${doc.slug}`}
                target="_blank"
                className="inline-flex h-10 items-center rounded-xl border border-gray-200 px-4 text-sm font-medium text-charcoal hover:border-sky/40 hover:text-sky"
              >
                Просмотр
              </Link>
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <section className={`${cabinetCardClass} space-y-4 p-5`}>
            <label className="block space-y-1 text-sm">
              <span className="text-slate">Заголовок</span>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-slate">Описание</span>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>

            <label className="block space-y-1 text-sm">
              <span className="text-slate">Статус</span>
              <NativeSelect
                value={status}
                onChange={(e) => setStatus(e.target.value as CmsDocument["status"])}
                disabled={!canPublish}
              >
                <option value="draft">Черновик</option>
                <option value="published">Опубликовано</option>
                <option value="archived">В архиве</option>
              </NativeSelect>
            </label>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold text-charcoal">Разделы</h2>
                <Button size="sm" variant="outline" onClick={addSection}>
                  Добавить раздел
                </Button>
              </div>

              {sections.map((section, index) => (
                <div key={index} className="space-y-2 rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      value={section.heading ?? ""}
                      onChange={(e) => updateSection(index, { heading: e.target.value })}
                      placeholder="Заголовок раздела (необязательно)"
                    />
                    <Button size="sm" variant="ghost" onClick={() => removeSection(index)}>
                      Удалить
                    </Button>
                  </div>
                  <label className="block space-y-1 text-xs text-slate">
                    Абзацы (по одному на строку)
                    <textarea
                      className="min-h-[80px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-charcoal"
                      value={listToLines(section.paragraphs)}
                      onChange={(e) =>
                        updateSection(index, { paragraphs: linesToList(e.target.value) })
                      }
                    />
                  </label>
                  <label className="block space-y-1 text-xs text-slate">
                    Список (по одному пункту на строку)
                    <textarea
                      className="min-h-[60px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-charcoal"
                      value={listToLines(section.list)}
                      onChange={(e) => updateSection(index, { list: linesToList(e.target.value) })}
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <section className={`${cabinetCardClass} p-4 text-sm`}>
              <Link href="/admin/content/documents" className="text-sky hover:underline">
                ← К списку документов
              </Link>
              <p className="mt-3 text-xs text-slate">
                Обновлено: {formatAdminWhen(doc.updatedAt)}
              </p>
              {doc.publishedAt ? (
                <p className="mt-1 text-xs text-slate">
                  Опубликовано: {formatAdminWhen(doc.publishedAt)}
                </p>
              ) : null}
              {canPublish ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 w-full"
                  disabled={saving}
                  onClick={() => void removeOverride()}
                >
                  Удалить CMS-версию
                </Button>
              ) : null}
            </section>

            <section className={`${cabinetCardClass} p-4`}>
              <h2 className="font-heading text-sm font-bold text-charcoal">Ревизии</h2>
              <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-xs text-slate">
                {revisions.length === 0 ? (
                  <li>Нет ревизий</li>
                ) : (
                  revisions.map((rev) => (
                    <li key={rev.id}>
                      #{rev.revisionNumber} · {formatAdminWhen(rev.createdAt)}
                    </li>
                  ))
                )}
              </ul>
            </section>
          </aside>
        </div>
      </AdminPageShell>
    </CapabilityGate>
  );
}
