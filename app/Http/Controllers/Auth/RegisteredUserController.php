<?php

namespace App\Http\Controllers\Auth;

use App\Actions\Registration\RegisterNewUser;
use App\Http\Controllers\Controller;
use App\Http\Requests\RegisterRequest;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('auth/Register');
    }

    /**
     * Handle an incoming registration request.
     */
    public function store(RegisterRequest $request, RegisterNewUser $action): RedirectResponse
    {
        $user = $action->handle($request->validated());

        event(new Registered($user));

        Auth::login($user);

        // AC-F01-04: Unverified email → redirect verifikasi
        if (! $user->hasVerifiedEmail()) {
            return redirect()->route('verification.notice');
        }

        // AC-F01-05: Redirect sesuai peran
        return redirect()->intended($user->homeRoute());
    }
}
