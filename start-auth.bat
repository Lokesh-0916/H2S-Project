@echo off
title MedSmart Auth Server

:: Start MongoDB in a separate window
echo Starting MongoDB...
start "MongoDB" cmd /k "mongod --dbpath d:\H2S-Project\auth-server\data\db --port 27017"

:: Wait 3 seconds for Mongo to start
timeout /t 3 /nobreak > nul

:: Start the auth server
echo Starting Auth Server on port 3001...
cd /d d:\H2S-Project\auth-server
node server.js
