@echo off
echo =======================================================
echo  Starting KalaSetu Artisan AI Web App (SIH26090)
echo =======================================================
echo Checking dependencies...
python -m pip install -r requirements.txt
echo.
echo Launching web application...
python app.py
pause
