# optimize_images.ps1
# Script to compress large JPG images in the assets folder

$assetsPath = ".\assets"
$quality = 75 # Quality level (0-100)

Add-Type -AssemblyName System.Drawing

$files = Get-ChildItem "$assetsPath\*.jpg", "$assetsPath\*.jpeg", "$assetsPath\*.JPG", "$assetsPath\*.JPEG" 

foreach ($file in $files) {
    if ($file.Length -gt 1000000) { # Only process files > 1MB
        Write-Host "Optimizing $($file.Name) ($([math]::round($file.Length/1MB, 2)) MB)..."
        
        try {
            $img = [System.Drawing.Image]::FromFile($file.FullName)
            
            # Encoder parameter for quality
            $myEncoder = [System.Drawing.Imaging.Encoder]::Quality
            $encoderParameters = New-Object System.Drawing.Imaging.EncoderParameters(1)
            $encoderParameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter($myEncoder, $quality)
            
            # Get data for JPEG codec
            $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
            
            $outputPath = "$($file.DirectoryName)\$($file.BaseName)_opt.jpg"
            
            # Save compressed version
            $img.Save($outputPath, $codec, $encoderParameters)
            $img.Dispose()
            
            # Replace original (optional, here we Rename original to .bak)
            $originalSize = $file.Length
            $newFile = Get-Item $outputPath
            $newSize = $newFile.Length
            
            if ($newSize -lt $originalSize) {
                Move-Item $file.FullName "$($file.FullName).bak" -Force
                Move-Item $outputPath $file.FullName -Force
                Write-Host "Reduced to $([math]::round($newSize/1MB, 2)) MB" -ForegroundColor Green
            } else {
                Write-Host "No reduction achieved. Keeping original." -ForegroundColor Yellow
                Remove-Item $outputPath
            }
            
        } catch {
            Write-Error "Failed to process $($file.Name): $_"
        }
    }
}

Write-Host "Optimization Complete!"
