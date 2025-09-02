#!/bin/bash

# Function to check and kill processes on a specific port
kill_port() {
    local port=$1
    echo "Checking port $port..."
    
    # Get PIDs of processes using the port
    pids=$(lsof -t -i :$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo "Port $port is in use by process(es): $pids"
        for pid in $pids; do
            echo "Killing process $pid on port $port..."
            kill $pid
            if [ $? -eq 0 ]; then
                echo "Successfully killed process $pid"
            else
                echo "Failed to kill process $pid, trying with force..."
                kill -9 $pid
                if [ $? -eq 0 ]; then
                    echo "Force killed process $pid"
                else
                    echo "Failed to kill process $pid even with force"
                fi
            fi
        done
    else
        echo "Port $port is not in use"
    fi
    echo ""
}

echo "Port Killer Script - Checking ports 3000 and 3001"
echo "=================================================="

# Check and kill processes on ports 3000 and 3001
kill_port 3000
kill_port 3001

echo "Done!"
