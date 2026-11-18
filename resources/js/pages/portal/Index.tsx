import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

interface Level {
  slug: string;
  label: string;
}

interface Props {
  levels: Level[];
}

export default function Index({ levels }: Props) {
  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">
          Portal Bumifest
        </h2>
      }
    >
      <Head title="Portal Jenjang" />

      <div className="py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h1 className="text-4xl font-bold text-gray-900">Portal Bumifest</h1>
            <p className="mt-2 text-lg text-gray-600">
              Pilih jenjang pendidikan Anda
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {levels.map((level) => (
              <Link
                key={level.slug}
                href={`/portal/${level.slug}`}
                className="group relative overflow-hidden rounded-lg bg-white p-8 shadow-md transition-all hover:shadow-lg"
              >
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="mb-4 text-5xl font-bold text-emerald-600">
                    {level.slug === 'sd-mi' ? '🎓' : '📚'}
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {level.label}
                  </h2>
                  <p className="mt-2 text-gray-600">
                    {level.slug === 'sd-mi'
                      ? 'Sekolah Dasar / Madrasah Ibtidaiyah'
                      : 'Sekolah Menengah Pertama / Madrasah Tsanawiyah'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
