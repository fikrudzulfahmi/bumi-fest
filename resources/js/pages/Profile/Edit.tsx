import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { PageProps } from '@/types';
import { Head } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';

export default function Edit({ mustVerifyEmail, status }: PageProps<{ mustVerifyEmail: boolean; status?: string }>) {
    return (
        <AuthenticatedLayout header={<h1>Profil</h1>}>
            <Head title="Profil" />

            {status && (
                <div className="toast toast--ok" role="status">
                    {status}
                </div>
            )}

            <div className="panel">
                <UpdateProfileInformationForm mustVerifyEmail={mustVerifyEmail} status={status} />
            </div>

            <div className="panel">
                <UpdatePasswordForm />
            </div>

            <div className="panel panel--flat" style={{ borderColor: 'var(--danger)' }}>
                <DeleteUserForm />
            </div>
        </AuthenticatedLayout>
    );
}
