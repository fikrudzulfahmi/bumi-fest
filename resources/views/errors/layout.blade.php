<!DOCTYPE html>
<html lang="id">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>@yield('title') — Bumifest</title>
        <style>
            html, body {
                background-color: #f9fafb;
                color: #1f2937;
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
                height: 100vh;
                margin: 0;
            }
            .full-height { height: 100vh; }
            .flex-center { align-items: center; display: flex; justify-content: center; }
            .content { text-align: center; padding: 24px; max-width: 28rem; }
            .code { font-size: 96px; font-weight: 800; color: #065f46; line-height: 1; margin: 0; }
            .title { font-size: 20px; font-weight: 600; margin-top: 12px; }
            .message { font-size: 14px; color: #6b7280; margin-top: 8px; }
            .link { display: inline-block; margin-top: 20px; padding: 10px 20px; min-height: 44px; border-radius: 8px; background: #065f46; color: #fff; text-decoration: none; font-size: 14px; font-weight: 600; }
        </style>
    </head>
    <body>
        <div class="flex-center full-height">
            <div class="content">
                <p class="code">@yield('code')</p>
                <div class="title">@yield('title')</div>
                <div class="message">@yield('message')</div>
                <a class="link" href="/">Kembali ke Beranda</a>
            </div>
        </div>
    </body>
</html>
