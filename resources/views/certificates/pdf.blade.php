<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <style>
        @page {
            margin: 0;
            size: {{ $paper[0] ?? 'a4' }} {{ $paper[1] ?? 'landscape' }};
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body, html { width: 100%; height: 100%; font-family: 'DejaVu Sans', sans-serif; }

        .certificate {
            position: relative;
            width: 100%;
            height: 100%;
        }
        .background {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: fill;
        }
        .field {
            position: absolute;
            transform: translate(-50%, -50%);
            font-family: 'DejaVu Sans', sans-serif;
            white-space: nowrap;
        }
        .field.left { transform: translate(0, -50%); }
    </style>
</head>
<body>
    <div class="certificate">
        <img class="background" src="{{ $image }}">

        <div class="field" style="left:{{ $layout['name']['x'] ?? 50 }}%; top:{{ $layout['name']['y'] ?? 45 }}%; font-size:{{ $nameFont }}pt; color:{{ $layout['name']['color'] ?? '#000000' }}; text-align:{{ $layout['name']['align'] ?? 'center' }};">
            {{ $name }}
        </div>

        <div class="field" style="left:{{ $layout['competition']['x'] ?? 50 }}%; top:{{ $layout['competition']['y'] ?? 30 }}%; font-size:{{ $layout['competition']['size'] ?? 20 }}pt; color:{{ $layout['competition']['color'] ?? '#000000' }}; text-align:{{ $layout['competition']['align'] ?? 'center' }};">
            {{ $placementLabel }}
        </div>

        <div class="field left" style="left:{{ $layout['number']['x'] ?? 12 }}%; top:{{ $layout['number']['y'] ?? 90 }}%; font-size:{{ $layout['number']['size'] ?? 12 }}pt; color:{{ $layout['number']['color'] ?? '#000000' }}; text-align:{{ $layout['number']['align'] ?? 'left' }};">
            No. {{ $number }}
        </div>

        <img src="{{ $qr }}" style="position:absolute; left:{{ $layout['qr']['x'] ?? 88 }}%; top:{{ $layout['qr']['y'] ?? 82 }}%; width:{{ $layout['qr']['size'] ?? 12 }}%; transform:translate(-50%,-50%);">
    </div>
</body>
</html>
