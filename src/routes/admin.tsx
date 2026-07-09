import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/store/gameStore";
import { toast, Toaster } from "sonner";
import { Trash2, Upload, ArrowLeft, ImageIcon, Music, Crown } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSecurityCheck = () => {
    if (answer.toLowerCase().trim() === "papaprince") {
      setAuthenticated(true);
      setError(false);
      setAnswer("");
    } else {
      setError(true);
      setAnswer("");
    }
  };

  if (!mounted) return null;

  if (!authenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gradient-heaven px-4 py-6 sm:px-6">
        <div className="w-full max-w-sm rounded-2xl sm:rounded-3xl border border-primary/30 bg-card/70 p-6 sm:p-8 text-center shadow-deep backdrop-blur-xl">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary mb-3 sm:mb-6">Admin Access</h1>
          <p className="font-body text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">Who are you?</p>
          <input
            type="password"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSecurityCheck()}
            placeholder="Enter your answer..."
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-border bg-background/50 text-base sm:text-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
            autoFocus
          />
          {error && (
            <p className="text-xs sm:text-sm text-red-500 mb-4 font-semibold">Incorrect answer. Try again.</p>
          )}
          <button
            onClick={handleSecurityCheck}
            className="w-full rounded-full bg-gradient-gold px-5 sm:px-6 py-2.5 sm:py-3 font-display text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary-foreground transition hover:scale-[1.02] active:scale-95 shadow-gold"
          >
            Verify
          </button>
        </div>
      </div>
    );
  }

  return <AdminStudio />;
}

function AdminStudio() {
  const assets = useGame((s) => s.assets);
  const updateAssets = useGame((s) => s.updateAssets);
  const addGalleryPhotos = useGame((s) => s.addGalleryPhotos);
  const removeGalleryPhoto = useGame((s) => s.removeGalleryPhoto);
  const galleryInput = useRef<HTMLInputElement>(null);

  const handleSingle = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: "heroPhoto" | "churchLogo" | "birthdaySong",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await fileToDataUrl(file);
      updateAssets({ [key]: url });
      toast.success("Uploaded & saved");
    } catch {
      toast.error("Could not read that file");
    }
  };

  const handleGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    try {
      const urls = await Promise.all(files.map(fileToDataUrl));
      addGalleryPhotos(urls);
      toast.success(`${urls.length} photo(s) added`);
    } catch {
      toast.error("Some files could not be read");
    }
    if (galleryInput.current) galleryInput.current.value = "";
  };

  return (
    <div className="min-h-screen bg-gradient-dawn px-4 py-8 sm:px-5 sm:py-10">
      <Toaster theme="dark" position="top-center" richColors />
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 sm:mb-8 flex flex-col gap-3">
          <Link to="/" className="inline-flex w-fit items-center gap-1 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to game
          </Link>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-gold-gradient">Admin Studio</h1>
            <p className="mt-2 font-body text-sm sm:text-base md:text-lg text-muted-foreground">
              Upload photos, music and details. The game uses them automatically — no code needed.
            </p>
          </div>
        </div>

        {/* Details */}
        <Section title="Tribute Details" icon={<Crown className="h-5 w-5" />}>
          <Field label="Pastor's Name">
            <input className="input" value={assets.pastorName}
              onChange={(e) => updateAssets({ pastorName: e.target.value })} />
          </Field>
          <Field label="Wife's Name (Companion)">
            <input className="input" value={assets.wifeName}
              onChange={(e) => updateAssets({ wifeName: e.target.value })} />
          </Field>
          <Field label="Church Name">
            <input className="input" value={assets.churchName}
              onChange={(e) => updateAssets({ churchName: e.target.value })} />
          </Field>
          <Field label="Birthday Dedication Message">
            <textarea className="input min-h-[110px] resize-y" value={assets.dedication}
              onChange={(e) => updateAssets({ dedication: e.target.value })} />
          </Field>
        </Section>

        {/* Media */}
        <Section title="Hero & Branding" icon={<ImageIcon className="h-5 w-5" />}>
          <MediaRow label="Title Background Photo" preview={assets.heroPhoto} type="image"
            onClear={() => updateAssets({ heroPhoto: null })}>
            <UploadBtn accept="image/*" onChange={(e) => handleSingle(e, "heroPhoto")} />
          </MediaRow>
          <MediaRow label="Church Logo" preview={assets.churchLogo} type="image"
            onClear={() => updateAssets({ churchLogo: null })}>
            <UploadBtn accept="image/*" onChange={(e) => handleSingle(e, "churchLogo")} />
          </MediaRow>
        </Section>

        <Section title="Birthday Song" icon={<Music className="h-5 w-5" />}>
          <MediaRow label="Celebration Music (plays in the finale)"
            preview={assets.birthdaySong} type="audio"
            onClear={() => updateAssets({ birthdaySong: null })}>
            <UploadBtn accept="audio/*" onChange={(e) => handleSingle(e, "birthdaySong")} />
          </MediaRow>
        </Section>

        {/* Gallery */}
        <Section title="Memory Gallery" icon={<ImageIcon className="h-5 w-5" />}>
          <p className="mb-3 text-sm text-muted-foreground">
            Childhood, family, ministry, crusades, ordinations — these appear in the final celebration slideshow.
          </p>
          <input ref={galleryInput} type="file" accept="image/*" multiple hidden onChange={handleGallery} />
          <button onClick={() => galleryInput.current?.click()}
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-gold px-4 sm:px-5 py-2 sm:py-2.5 font-display text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-gold hover:scale-[1.02] active:scale-95 transition">
            <Upload className="h-3.5 sm:h-4 w-3.5 sm:w-4" /> Add Photos
          </button>
          {assets.galleryPhotos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 md:grid-cols-4">
              {assets.galleryPhotos.map((p, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border/60">
                  <img src={p} alt={`Memory ${i + 1}`} className="h-full w-full object-cover" />
                  <button onClick={() => removeGalleryPhoto(i)}
                    className="absolute right-1 top-1 rounded-md bg-background/80 p-1 opacity-0 transition group-hover:opacity-100 active:scale-95">
                    <Trash2 className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-muted-foreground">No photos yet.</p>
          )}
        </Section>

        <p className="mt-6 sm:mt-8 rounded-lg sm:rounded-xl border border-border/50 bg-card/40 p-3 sm:p-4 text-center text-xs sm:text-sm text-muted-foreground">
          Uploads are saved securely in this browser. To share the finished tribute with these
          exact assets across devices, connect Lovable Cloud so media is stored online.
        </p>
      </div>

      <style>{`
        .input{width:100%;border-radius:0.6rem;border:1px solid var(--color-border);
          background:color-mix(in oklab,var(--color-background) 60%,transparent);
          padding:0.5rem 0.75rem;color:var(--color-foreground);font-family:var(--font-body);font-size:0.95rem;
          line-height:1.5;}
        @media (min-width:640px){
          .input{padding:0.6rem 0.85rem;font-size:1.05rem;}
        }
        .input:focus{outline:2px solid var(--color-ring);outline-offset:1px;}
      `}</style>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-4 sm:mb-6 rounded-lg sm:rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-6 backdrop-blur-md">
      <h2 className="mb-3 sm:mb-4 flex items-center gap-2 font-display text-base sm:text-lg md:text-xl font-semibold text-foreground">
        <span className="text-primary text-lg sm:text-xl">{icon}</span> {title}
      </h2>
      <div className="space-y-3 sm:space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs sm:text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function UploadBtn({ accept, onChange }: { accept: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-primary/50 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold uppercase tracking-widest text-primary transition hover:bg-primary/10 active:scale-95">
      <Upload className="h-3 sm:h-3.5 w-3 sm:w-3.5" /> Upload
      <input type="file" accept={accept} hidden onChange={onChange} />
    </label>
  );
}

function MediaRow({
  label, preview, type, onClear, children,
}: {
  label: string; preview: string | null; type: "image" | "audio";
  onClear: () => void; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 rounded-lg sm:rounded-xl border border-border/50 bg-background/30 p-3 sm:p-3">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        {preview && type === "image" && (
          <img src={preview} alt="" className="h-10 sm:h-12 w-10 sm:w-12 rounded-lg object-cover flex-shrink-0" />
        )}
        {preview && type === "audio" && <Music className="h-7 sm:h-8 w-7 sm:w-8 text-primary flex-shrink-0" />}
        <span className="truncate text-xs sm:text-sm text-foreground">
          {label} {preview && <span className="text-primary">· saved</span>}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
        {children}
        {preview && (
          <button onClick={onClear} className="rounded-md p-1.5 sm:p-2 text-destructive hover:bg-destructive/10 transition">
            <Trash2 className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
