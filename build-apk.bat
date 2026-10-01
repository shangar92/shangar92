@echo off
rem Builds the Day Off app as a stand-alone APK and installs it on the open emulator or USB phone.
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
echo Installing on the emulator / phone ...
"%ADB%" install -r "%APK%"
if errorlevel 1 (
  echo Could not install. Make sure the emulator is open, then run this again.
  exit /b 1
)
"%ADB%" shell monkey -p com.kar.dayoff -c android.intent.category.LAUNCHER 1 >nul 2>nul
echo.
echo Done - Day Off is open on the emulator.
exit /b 0

:failed
echo.
echo BUILD FAILED - send a screenshot of the lines above "BUILD FAILED".
exit /b 1
