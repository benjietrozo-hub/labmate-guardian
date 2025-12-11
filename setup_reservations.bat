@echo off
echo Setting up Equipment Reservation System...
echo.

REM Check if MySQL is available
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: MySQL is not available in PATH
    echo Please ensure MySQL is installed and accessible
    pause
    exit /b 1
)

echo MySQL found. Proceeding with database setup...
echo.

REM Execute the SQL file
echo Importing reservation tables...
mysql -u root labmate_guardian < database/reservations.sql

if %errorlevel% equ 0 (
    echo.
    echo SUCCESS: Reservation tables created successfully!
    echo.
    echo Tables created:
    echo - equipment_reservations
    echo - reservation_waiting_list
    echo - System settings for reservations
    echo.
    echo You can now access the reservation system at /reservations
) else (
    echo.
    echo ERROR: Failed to create reservation tables
    echo Please check:
    echo 1. MySQL service is running
    echo 2. Database 'labmate_guardian' exists
    echo 3. MySQL credentials are correct
)

echo.
pause
