import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

interface Competition {
  id: number;
  name: string;
  slug: string;
  category: string;
  fee: number;
  opens_at: string;
  closes_at: string;
  quota: number | null;
  status: string;
}

interface Announcement {
  id: number;
  title: string;
  body: string;
  published_at: string;
}

interface Level {
  slug: string;
  label: string;
}

interface Props {
  level: Level;
  competitions: Competition[];
  announcements: Announcement[];
}

export default function Level({ level, competitions, announcements }: Props) {
  const statusColors = {
    'Dibuka': 'bg-green-100 text-green-800',
    'Segera dibuka': 'bg-blue-100 text-blue-800',
    'Ditutup': 'bg-gray-100 text-gray-800',
    'Kuota penuh': 'bg-red-100 text-red-800',
  };

  return (
    <AuthenticatedLayout
      header={
        <h2 className="text-xl font-semibold leading-tight text-gray-800">
          Portal {level.label}
        </h2>
      }
    >
      <Head title={`Portal ${level.label}`} />

      <div className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Grid: Competitions & Announcements */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Competitions */}
            <div className="lg:col-span-2">
              <h3 className="mb-6 text-2xl font-bold text-gray-900">
                Lomba Tersedia
              </h3>
              <div className="space-y-4">
                {competitions.length > 0 ? (
                  competitions.map((comp) => (
                    <div
                      key={comp.id}
                      className="overflow-hidden rounded-lg bg-white shadow"
                    >
                      <div className="p-6">
                        <div className="mb-4 flex items-start justify-between">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {comp.name}
                            </h4>
                            <p className="mt-1 text-sm text-gray-600">
                              {comp.category === 'individual'
                                ? 'Individu'
                                : 'Tim'}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-medium ${
                              statusColors[comp.status as keyof typeof statusColors] ||
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {comp.status}
                          </span>
                        </div>

                        <div className="mb-4 space-y-2 text-sm text-gray-600">
                          <p>
                            <strong>Biaya:</strong> Rp
                            {comp.fee.toLocaleString('id-ID')}
                          </p>
                          <p>
                            <strong>Buka:</strong>{' '}
                            {new Date(comp.opens_at).toLocaleDateString(
                              'id-ID'
                            )}
                          </p>
                          <p>
                            <strong>Tutup:</strong>{' '}
                            {new Date(comp.closes_at).toLocaleDateString(
                              'id-ID'
                            )}
                          </p>
                          {comp.quota !== null && (
                            <p>
                              <strong>Kuota:</strong> {comp.quota}
                            </p>
                          )}
                        </div>

                        <button className="w-full rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700">
                          Lihat Detail
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg bg-white p-6 text-center text-gray-600">
                    Tidak ada lomba pada jenjang ini
                  </div>
                )}
              </div>
            </div>

            {/* Announcements */}
            <div>
              <h3 className="mb-6 text-2xl font-bold text-gray-900">
                Pengumuman
              </h3>
              <div className="space-y-4">
                {announcements.length > 0 ? (
                  announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="rounded-lg bg-white p-4 shadow"
                    >
                      <h4 className="font-semibold text-gray-900">
                        {ann.title}
                      </h4>
                      <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                        {ann.body}
                      </p>
                      <p className="mt-2 text-xs text-gray-400">
                        {new Date(ann.published_at).toLocaleDateString(
                          'id-ID'
                        )}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg bg-white p-4 text-center text-sm text-gray-600">
                    Tidak ada pengumuman
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
