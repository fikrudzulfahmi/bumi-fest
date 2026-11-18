<?php

namespace App\Exceptions;

class BusinessRuleViolation extends \Exception
{
    public function __construct(string $message = '')
    {
        parent::__construct($message);
    }
}
