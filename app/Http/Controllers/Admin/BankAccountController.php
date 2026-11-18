<?php

namespace App\Http\Controllers\Admin;

use App\Actions\BankAccount\DeleteBankAccount;
use App\Actions\BankAccount\StoreBankAccount;
use App\Actions\BankAccount\UpdateBankAccount;
use App\Http\Controllers\Controller;
use App\Http\Requests\BankAccountRequest;
use App\Models\BankAccount;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BankAccountController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/bank-accounts/Index', [
            'accounts' => BankAccount::orderBy('sort')->get(),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/bank-accounts/Create');
    }

    public function store(BankAccountRequest $request): RedirectResponse
    {
        (new StoreBankAccount)->handle($request->validated());

        return redirect()->route('admin.bank-accounts.index')
            ->with('success', 'Rekening berhasil ditambah.');
    }

    public function edit(BankAccount $bankAccount): Response
    {
        return Inertia::render('admin/bank-accounts/Edit', [
            'account' => $bankAccount,
        ]);
    }

    public function update(BankAccountRequest $request, BankAccount $bankAccount): RedirectResponse
    {
        (new UpdateBankAccount)->handle($bankAccount, $request->validated());

        return redirect()->route('admin.bank-accounts.index')
            ->with('success', 'Rekening berhasil diperbarui.');
    }

    public function destroy(BankAccount $bankAccount): RedirectResponse
    {
        (new DeleteBankAccount)->handle($bankAccount);

        return redirect()->route('admin.bank-accounts.index')
            ->with('success', 'Rekening berhasil dihapus.');
    }
}
