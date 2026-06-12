@echo off
echo ===================================================
echo Installazione Task di Backup Pianificato per LOGIBOOK
echo ===================================================

set PROJECT_DIR=%cd%
set SCRIPT_NAME=LogiBookBackupTask

echo La directory del progetto e': %PROJECT_DIR%

:: Usiamo schtasks per pianificare l'esecuzione ogni giorno alle 02:00
schtasks /create /tn "%SCRIPT_NAME%" /tr "cmd.exe /c cd /d \"%PROJECT_DIR%\" && npm run backup" /sc daily /st 02:00 /f

if %ERRORLEVEL% equ 0 (
    echo.
    echo Task pianificato creato con successo!
    echo Il backup verra' eseguito ogni giorno alle 02:00.
) else (
    echo.
    echo ERRORE: Impossibile creare il task pianificato. Assicurati di eseguire questo script come Amministratore.
)
