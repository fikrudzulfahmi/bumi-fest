<?php

namespace App\Providers;

use App\Services\Whatsapp\LogWhatsappGateway;
use App\Services\Whatsapp\NullWhatsappGateway;
use App\Services\Whatsapp\WhatsappGateway;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // AC-F08-05: driver WA dipilih lewat config('services.whatsapp.driver').
        $this->app->bind(WhatsappGateway::class, function (): WhatsappGateway {
            return match (config('services.whatsapp.driver')) {
                'null' => new NullWhatsappGateway,
                default => new LogWhatsappGateway,
            };
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Prevent lazy loading in non-production
        if (! app()->isProduction()) {
            Model::preventLazyLoading();
        }
    }
}
