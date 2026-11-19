<?php

namespace App\Models;

use App\Enums\InvoiceStatus;
use Database\Factories\InvoiceFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    /** @use HasFactory<InvoiceFactory> */
    use HasFactory;

    protected $fillable = [
        'number',
        'owner_id',
        'subtotal',
        'unique_code',
        'discount',
        'total',
        'status',
        'bank_name',
        'bank_account_number',
        'bank_account_holder',
        'proof_path',
        'proof_uploaded_at',
        'due_at',
        'verified_by',
        'verified_at',
        'rejection_reason',
    ];

    protected $casts = [
        'status' => InvoiceStatus::class,
        'subtotal' => 'integer',
        'unique_code' => 'integer',
        'discount' => 'integer',
        'total' => 'integer',
        'proof_uploaded_at' => 'datetime',
        'due_at' => 'datetime',
        'verified_at' => 'datetime',
    ];

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(Registration::class);
    }

    /**
     * @param  Builder<self>  $query
     * @return Builder<self>
     */
    public function scopeOpen($query)
    {
        return $query->whereIn('status', [
            InvoiceStatus::Unpaid,
            InvoiceStatus::AwaitingVerification,
            InvoiceStatus::Rejected,
        ]);
    }
}
