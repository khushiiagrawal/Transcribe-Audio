// app/page.tsx
import AudioUploader from "../components/AudioUploader";

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950">
      <div className="max-w-6xl mx-auto">
        <AudioUploader />
      </div>
    </main>
  );
}
