@echo off
rem Builds the Day Off app as a stand-alone APK and installs it on every connected emulator and phone.
rem Run from the project folder:  .\build-apk.bat
setlocal
cd /d "%~dp0"
set "ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
if defined ANDROID_HOME set "ADB=%ANDROID_HOME%\platform-tools\adb.exe"
set "APK=%~dp0android\app\build\outputs\apk\release\app-release.apk"

if not exist "android\gradlew.bat" (
  echo Creating the android folder ...
  call npx expo prebuild --platform android
  if errorlevel 1 goto failed
)

echo Building the APK, this takes a few minutes ...
pushd android
call gradlew.bat assembleRelease
if errorlevel 1 (
  popd
  goto failed
)
popd

echo.
echo APK ready: %APK%
echo Installing on every connected emulator / phone ...
set "COUNT=0"
for /f "skip=1 tokens=1,2" %%a in ('call "%ADB%" devices') do (
  if "%%b"=="device" (
    echo - %%a
    "%ADB%" -s %%a install -r "%APK%"
    "%ADB%" -s %%a shell monkey -p com.kar.dayoff -c android.intent.category.LAUNCHER 1 >nul 2>nul
    set /a COUNT+=1
  )
)
if "%COUNT%"=="0" (
  echo No emulator or phone found. Open the emulator or connect the phone, then run this again.
  exit /b 1
)
echo.
echo Done - Day Off is installed and open.
exit /b 0

:failed
echo.
echo BUILD FAILED - send a screenshot of the lines above "BUILD FAILED".
exit /b 1
