# Genera los iconos de la app y de la PWA a partir de LogoLovePlans.jpg
# Uso: powershell -ExecutionPolicy Bypass -File tools/generate-icons.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$source = Join-Path $root 'LogoLovePlans.jpg'
$assets = Join-Path $root 'assets\images'
$publicIcons = Join-Path $root 'public\icons'
New-Item -ItemType Directory -Force -Path $assets, $publicIcons | Out-Null

Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;

public static class IconMaker
{
    public static Bitmap RemoveWhite(Bitmap source, int tolerance)
    {
        var rect = new Rectangle(0, 0, source.Width, source.Height);
        var result = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(result)) { g.DrawImage(source, rect); }

        var data = result.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        int stride = data.Stride;
        int bytes = Math.Abs(stride) * result.Height;
        var buffer = new byte[bytes];
        System.Runtime.InteropServices.Marshal.Copy(data.Scan0, buffer, 0, bytes);

        // (método estático aparte: el compilador de Add-Type no soporta funciones locales)

        var seen = new bool[result.Width, result.Height];
        var queue = new Queue<Point>();
        for (int x = 0; x < result.Width; x++)
        {
            queue.Enqueue(new Point(x, 0));
            queue.Enqueue(new Point(x, result.Height - 1));
        }
        for (int y = 0; y < result.Height; y++)
        {
            queue.Enqueue(new Point(0, y));
            queue.Enqueue(new Point(result.Width - 1, y));
        }

        while (queue.Count > 0)
        {
            var p = queue.Dequeue();
            if (p.X < 0 || p.Y < 0 || p.X >= result.Width || p.Y >= result.Height) continue;
            if (seen[p.X, p.Y]) continue;
            seen[p.X, p.Y] = true;
            int i = p.Y * stride + p.X * 4;
            byte b = buffer[i], gr = buffer[i + 1], r = buffer[i + 2], a = buffer[i + 3];
            if (a == 0) continue;
            if (!NearWhite(b, gr, r, tolerance)) continue;
            buffer[i + 3] = 0;
            queue.Enqueue(new Point(p.X + 1, p.Y));
            queue.Enqueue(new Point(p.X - 1, p.Y));
            queue.Enqueue(new Point(p.X, p.Y + 1));
            queue.Enqueue(new Point(p.X, p.Y - 1));
        }

        System.Runtime.InteropServices.Marshal.Copy(buffer, 0, data.Scan0, bytes);
        result.UnlockBits(data);
        return result;
    }

    private static bool NearWhite(byte b, byte gr, byte r, int tolerance)
    {
        return r >= 255 - tolerance && gr >= 255 - tolerance && b >= 255 - tolerance;
    }

    public static void Compose(string markPath, string outPath, int size, double markScale, Color? background, bool round = false)
    {
        using (var mark = new Bitmap(markPath))
        using (var bmp = new Bitmap(size, size, PixelFormat.Format32bppArgb))
        using (var g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.CompositingQuality = CompositingQuality.HighQuality;
            g.Clear(background ?? Color.Transparent);

            int box = (int)Math.Round(size * markScale);
            int x = (size - box) / 2;
            int y = (size - box) / 2;
            g.DrawImage(mark, new Rectangle(x, y, box, box));
            bmp.Save(outPath, ImageFormat.Png);
        }
    }

    public static void ComposeWide(string markPath, string outPath, int width, int height, Color background)
    {
        using (var mark = new Bitmap(markPath))
        using (var bmp = new Bitmap(width, height, PixelFormat.Format32bppArgb))
        using (var g = Graphics.FromImage(bmp))
        {
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.CompositingQuality = CompositingQuality.HighQuality;
            g.Clear(background);

            int box = (int)(height * 0.72);
            g.DrawImage(mark, new Rectangle((int)(width * 0.10), (height - box) / 2, box, box));

            var title = "LovePlans";
            using (var font = new Font("Segoe UI", height * 0.16f, FontStyle.Bold, GraphicsUnit.Pixel))
            using (var small = new Font("Segoe UI", height * 0.045f, FontStyle.Regular, GraphicsUnit.Pixel))
            using (var dark = new SolidBrush(Color.FromArgb(74, 66, 69)))
            using (var muted = new SolidBrush(Color.FromArgb(138, 127, 131)))
            {
                g.DrawString(title, font, dark, width * 0.42f, height * 0.34f);
                g.DrawString("Todos los planes que so\u00f1amos juntos", small, muted, width * 0.43f, height * 0.53f);
            }

            bmp.Save(outPath, ImageFormat.Png);
        }
    }
}
"@ -ReferencedAssemblies System.Drawing

$markPath = Join-Path $env:TEMP 'loveplans-mark.png'
$original = [System.Drawing.Bitmap]::FromFile($source)
$mark = [IconMaker]::RemoveWhite($original, 8)
$mark.Save($markPath, [System.Drawing.Imaging.ImageFormat]::Png)
$original.Dispose()

$cream = [System.Drawing.Color]::FromArgb(248, 246, 241)

# Iconos nativos y PWA
[IconMaker]::Compose($markPath, (Join-Path $assets 'icon.png'), 1024, 0.80, $cream)
[IconMaker]::Compose($markPath, (Join-Path $assets 'adaptive-icon.png'), 1024, 0.62, $null)
[IconMaker]::Compose($markPath, (Join-Path $assets 'splash-icon.png'), 1024, 0.72, $null)
[IconMaker]::Compose($markPath, (Join-Path $assets 'favicon.png'), 64, 0.86, $cream)

[IconMaker]::Compose($markPath, (Join-Path $publicIcons 'icon-192.png'), 192, 0.82, $cream)
[IconMaker]::Compose($markPath, (Join-Path $publicIcons 'icon-512.png'), 512, 0.82, $cream)
[IconMaker]::Compose($markPath, (Join-Path $publicIcons 'maskable-512.png'), 512, 0.56, $cream)
[IconMaker]::Compose($markPath, (Join-Path $publicIcons 'apple-touch-icon-180.png'), 180, 0.84, $cream)
Copy-Item (Join-Path $publicIcons 'icon-192.png') (Join-Path $root 'public\favicon.png') -Force
Copy-Item (Join-Path $publicIcons 'apple-touch-icon-180.png') (Join-Path $root 'public\apple-touch-icon.png') -Force

[IconMaker]::ComposeWide($markPath, (Join-Path $publicIcons 'og-1200x630.png'), 1200, 630, $cream)

Copy-Item $markPath (Join-Path $assets 'logo-mark.png') -Force

Write-Host "Iconos generados en assets/images y public/icons"
